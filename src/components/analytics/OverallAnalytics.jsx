import React from 'react';
import { getAggregateFromServer, sum, collectionGroup, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../firebase/firebase';
import { colorThemes } from '../../constants/theme';
import { useStudentPerformanceData } from '../../hooks/useStudentPerformanceData';
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
  const { students, assignments, loading: perfLoading } = useStudentPerformanceData(subjects);

  React.useEffect(() => {
    let cancelled = false;
    const fetchAllStats = async () => {
      if (!db || perfLoading) return;
      setStats((s) => ({ ...s, isLoading: true }));

      let totalDeposits = 0;
      let totalWithdrawals = 0;

      try {
        // Use Firestore Aggregation Queries for efficiency
        const transactionsRef = collectionGroup(db, 'transactions');
        const depositQuery = query(transactionsRef, where('type', '==', 'deposit'));
        const withdrawQuery = query(transactionsRef, where('type', '==', 'withdraw'));

        const [depositSnap, withdrawSnap] = await Promise.all([
          getAggregateFromServer(depositQuery, { total: sum('amount') }),
          getAggregateFromServer(withdrawQuery, { total: sum('amount') })
        ]);

        totalDeposits = depositSnap.data().total || 0;
        totalWithdrawals = withdrawSnap.data().total || 0;
      } catch (error) {
        console.warn('Aggregation failed (likely missing index), falling back to client-side calculation:', error);
        try {
             const transactionsQuery = collectionGroup(db, 'transactions');
             const querySnapshot = await getDocs(transactionsQuery);
             
             querySnapshot.forEach((doc) => {
                const data = doc.data();
                // Simple safety check if it belongs to savings
                if (doc.ref.path.includes('/savings/')) {
                    if (data.type === 'deposit') totalDeposits += (data.amount || 0);
                    else if (data.type === 'withdraw') totalWithdrawals += (data.amount || 0);
                }
             });
        } catch (fallbackError) {
            console.error('Fallback failed:', fallbackError);
        }
      }

      // ใช้ข้อมูลคะแนน/นักเรียนจากแคชกลาง (ลดรอบยิง Firestore ซ้ำ)
      let grandTotalScore = 0;
      let grandTotalMaxScore = 0;
      const subjectTotals = new Map();

      subjects.forEach((subject) => {
        subjectTotals.set(subject.id, { score: 0, max: 0 });
      });

      students.forEach((student) => {
        Object.entries(student.scores || {}).forEach(([assignmentId, score]) => {
          const assignment = assignments.get(assignmentId);
          if (!assignment || typeof score !== 'number') return;
          const totals = subjectTotals.get(assignment.subjectId);
          if (!totals) return;

          totals.score += score;
          totals.max += assignment.maxScore;
          grandTotalScore += score;
          grandTotalMaxScore += assignment.maxScore;
        });
      });

      const subjectAverages = subjects.map((subject) => {
        const totals = subjectTotals.get(subject.id) || { score: 0, max: 0 };
        const subjectAverage = totals.max > 0 ? (totals.score / totals.max) * 100 : 0;
        const themeKey = subject.colorTheme || 'teal';
        return {
          id: subject.id,
          name: subject.name,
          average: subjectAverage,
          colorTheme: { key: themeKey, ...colorThemes[themeKey] },
        };
      });

      const overallAverage =
        grandTotalMaxScore > 0 ? (grandTotalScore / grandTotalMaxScore) * 100 : 0;

      if (cancelled) return;
      setPerformanceData(subjectAverages.sort((a, b) => b.average - a.average));
      setStats({
        totalStudents: students.size,
        overallAverage,
        totalDeposits,
        totalWithdrawals,
        isLoading: false,
      });
    };

    fetchAllStats();
    return () => {
      cancelled = true;
    };
  }, [assignments, perfLoading, students, subjects]);

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
