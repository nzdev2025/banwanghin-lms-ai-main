import React from 'react';
import { getDocs, collection, collectionGroup } from 'firebase/firestore';
import { db, appId } from '../../firebase/firebase';
import { grades } from '../../constants/data';
import { colorThemes } from '../../constants/theme';
import KeyMetricCard from './KeyMetricCard';
import SavingsGlowChart from './SavingsGlowChart';
import SubjectPerformanceChart from './SubjectPerformanceChart';
import AtRiskStudents from '../dashboard/AtRiskStudents';
import TopStudentsLeaderboard from '../dashboard/TopStudentsLeaderboard';
import RecentActivityFeed from '../dashboard/RecentActivityFeed';

const OverallAnalytics = ({ subjects, onStudentClick }) => {
  const [stats, setStats] = React.useState({
    totalStudents: 0,
    overallAverage: 0,
    totalDeposits: 0,
    totalWithdrawals: 0,
    isLoading: true,
  });
  const [performanceData, setPerformanceData] = React.useState([]);

  React.useEffect(() => {
    const fetchAllStats = async () => {
      if (!db) {
        setStats((s) => ({ ...s, isLoading: false }));
        return;
      }
      setStats((s) => ({ ...s, isLoading: true }));

      let totalStudents = 0;
      let grandTotalScore = 0;
      let grandTotalMaxScore = 0;
      let totalDeposits = 0;
      let totalWithdrawals = 0;
      const subjectAverages = [];

      try {
        const transactionsQuery = collectionGroup(db, 'transactions');
        const querySnapshot = await getDocs(transactionsQuery);

        querySnapshot.forEach((doc) => {
          if (doc.ref.path.startsWith(`artifacts/${appId}/public/data/savings`)) {
            const transaction = doc.data();
            if (transaction.type === 'deposit') {
              totalDeposits += transaction.amount;
            } else if (transaction.type === 'withdraw') {
              totalWithdrawals += transaction.amount;
            }
          }
        });
      } catch (error) {
        console.error('Error fetching savings data:', error);
      }

      const studentCountPromises = grades.map((grade) =>
        getDocs(collection(db, `artifacts/${appId}/public/data/rosters/${grade}/students`)),
      );
      const studentCountSnapshots = await Promise.all(studentCountPromises);
      studentCountSnapshots.forEach((snap) => {
        totalStudents += snap.size;
      });

      for (const subject of subjects) {
        let subjectTotalScore = 0;
        let subjectTotalMaxScore = 0;

        for (const grade of grades) {
          const basePath = `artifacts/${appId}/public/data/subjects/${subject.id}/grades/${grade}`;
          try {
            const [assignmentsSnap, scoresSnap] = await Promise.all([
              getDocs(collection(db, `${basePath}/assignments`)),
              getDocs(collection(db, `${basePath}/scores`)),
            ]);

            const assignmentsMap = new Map();
            assignmentsSnap.forEach((doc) => assignmentsMap.set(doc.id, doc.data()));

            scoresSnap.forEach((scoreDoc) => {
              const scores = scoreDoc.data();
              for (const assignmentId in scores) {
                const assignment = assignmentsMap.get(assignmentId);
                if (assignment && typeof scores[assignmentId] === 'number') {
                  subjectTotalScore += scores[assignmentId];
                  subjectTotalMaxScore += assignment.maxScore;
                }
              }
            });
          } catch {
            // ignore fetch errors for individual subjects
          }
        }

        grandTotalScore += subjectTotalScore;
        grandTotalMaxScore += subjectTotalMaxScore;

        const subjectAverage =
          subjectTotalMaxScore > 0 ? (subjectTotalScore / subjectTotalMaxScore) * 100 : 0;
        const themeKey = subject.colorTheme || 'teal';
        subjectAverages.push({
          id: subject.id,
          name: subject.name,
          average: subjectAverage,
          colorTheme: { key: themeKey, ...colorThemes[themeKey] },
        });
      }

      const overallAverage =
        grandTotalMaxScore > 0 ? (grandTotalScore / grandTotalMaxScore) * 100 : 0;

      setPerformanceData(subjectAverages.sort((a, b) => b.average - a.average));
      setStats({
        totalStudents,
        overallAverage,
        totalDeposits,
        totalWithdrawals,
        isLoading: false,
      });
    };

    fetchAllStats();
  }, [subjects]);

  const metricCards = [
    {
      key: 'subjects',
      icon: 'BookOpen',
      title: 'จำนวนวิชาทั้งหมด',
      value: subjects.length.toLocaleString('th-TH'),
      detail: 'รายวิชาที่เปิดใช้งาน',
      gradient: 'bg-gradient-to-br from-[#818cf8] via-[#a855f7] to-[#ec4899]',
      iconAccent: 'bg-white/20 text-white',
    },
    {
      key: 'students',
      icon: 'Users',
      title: 'จำนวนนักเรียนในระบบ',
      value: stats.totalStudents.toLocaleString('th-TH'),
      detail: 'นักเรียนที่ลงทะเบียน',
      gradient: 'bg-gradient-to-br from-[#ec4899] via-[#f97316] to-[#fb923c]',
      iconAccent: 'bg-white/20 text-white',
    },
    {
      key: 'average',
      icon: 'Target',
      title: 'ค่าเฉลี่ยคะแนนรวม',
      value: `${stats.overallAverage.toFixed(2)}%`,
      detail: 'เฉลี่ยทุกวิชา',
      gradient: 'bg-gradient-to-br from-[#38bdf8] via-[#6366f1] to-[#8b5cf6]',
      iconAccent: 'bg-white/20 text-white',
    },
    {
      key: 'deposits',
      icon: 'Wallet',
      title: 'ยอดเงินฝากทั้งหมด',
      value: `${stats.totalDeposits.toLocaleString('th-TH')} ฿`,
      detail: 'ยอดเงินสะสม',
      gradient: 'bg-gradient-to-br from-[#34d399] via-[#22d3ee] to-[#0ea5e9]',
      iconAccent: 'bg-white/20 text-white',
    },
  ].map((metric) => ({
    ...metric,
    title: metric.title,
    detail: metric.detail,
    value: metric.value,
  }));

  return (
    <section className="flex h-full flex-col gap-6">
      <div className="grid flex-none grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {metricCards.map((metric) => (
          <KeyMetricCard
            key={metric.key}
            icon={metric.icon}
            title={metric.title}
            value={metric.value}
            detail={metric.detail}
            gradient={metric.gradient}
            iconAccent={metric.iconAccent}
            isLoading={stats.isLoading}
          />
        ))}
      </div>

      <div className="grid flex-none gap-6 xl:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)]">
        <SavingsGlowChart />
        <SubjectPerformanceChart data={performanceData} isLoading={stats.isLoading} />
      </div>

      <div className="grid flex-1 gap-6 xl:grid-cols-[minmax(0,1.05fr)_minmax(0,1.15fr)]">
        <div className="grid h-full gap-6 md:grid-cols-2">
          <AtRiskStudents subjects={subjects} onStudentClick={onStudentClick} />
          <TopStudentsLeaderboard subjects={subjects} onStudentClick={onStudentClick} />
        </div>
        <div className="h-full">
          <RecentActivityFeed />
        </div>
      </div>
    </section>
  );
};

export default OverallAnalytics;
