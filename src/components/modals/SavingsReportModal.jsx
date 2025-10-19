// src/components/modals/SavingsReportModal.jsx (Version 2.1 - Final & Polished)

import React, { useState, useEffect } from 'react';
import { collection, collectionGroup, getDocs, query, where, orderBy } from 'firebase/firestore';
import { db, appId } from '../../firebase/firebase';
import Icon from '../../icons/Icon';
import { grades } from '../../constants/data';

const SavingsReportModal = ({ onClose }) => {
    const [reportType, setReportType] = useState('daily');
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().slice(0, 10));
    const [transactions, setTransactions] = useState([]);
    const [summary, setSummary] = useState({ deposits: 0, withdrawals: 0 });
    const [isLoading, setIsLoading] = useState(false);
    const [studentData, setStudentData] = useState({});

    useEffect(() => {
        const fetchAllStudents = async () => {
            const allStudents = {};
            for (const grade of grades) {
                const studentsPath = `artifacts/${appId}/public/data/rosters/${grade}/students`;
                const studentsSnap = await getDocs(collection(db, studentsPath));
                studentsSnap.forEach(doc => {
                    allStudents[doc.id] = { ...doc.data(), grade };
                });
            }
            setStudentData(allStudents);
        };
        fetchAllStudents();
    }, []);

    const handleFetchReport = async () => {
        if (!selectedDate) return;
        setIsLoading(true);
        setTransactions([]);
        setSummary({ deposits: 0, withdrawals: 0 });

        const { start, end } = getDateRange(reportType, selectedDate);

        try {
            const transactionsQuery = query(
                collectionGroup(db, 'transactions'),
                where('timestamp', '>=', start),
                where('timestamp', '<=', end),
                orderBy('timestamp', 'desc')
            );

            const querySnapshot = await getDocs(transactionsQuery);
            const fetchedTransactions = [];
            let totalDeposits = 0;
            let totalWithdrawals = 0;

            querySnapshot.forEach(doc => {
                const data = doc.data();
                const match = doc.ref.path.match(/students\/([a-zA-Z0-9]+)\/transactions/);

                if (match) {
                    const studentId = match[1];
                    const studentInfo = studentData[studentId];

                    fetchedTransactions.push({
                        id: doc.id,
                        ...data,
                        studentName: studentInfo ? `${studentInfo.firstName} ${studentInfo.lastName}` : 'N/A',
                        grade: studentInfo ? `ป.${studentInfo.grade.replace('p','')}` : 'N/A'
                    });

                    if (data.type === 'deposit') {
                        totalDeposits += data.amount;
                    } else if (data.type === 'withdraw') {
                        totalWithdrawals += data.amount;
                    }
                }
            });

            setTransactions(fetchedTransactions);
            setSummary({ deposits: totalDeposits, withdrawals: totalWithdrawals });
        } catch (error) {
            console.error("Error fetching report:", error);
            alert("เกิดข้อผิดพลาดในการดึงข้อมูลรายงาน: " + error.message);
        } finally {
            setIsLoading(false);
        }
    };

    const getDateRange = (type, dateString) => {
        let start, end;
    
        if (type === 'daily') {
            const [year, month, day] = dateString.split('-').map(Number);
            start = new Date(Date.UTC(year, month - 1, day, 0, 0, 0, 0));
            end = new Date(Date.UTC(year, month - 1, day, 23, 59, 59, 999));
        } else if (type === 'monthly') {
            const [year, month] = dateString.split('-').map(Number);
            start = new Date(Date.UTC(year, month - 1, 1, 0, 0, 0, 0));
            end = new Date(Date.UTC(year, month, 0, 23, 59, 59, 999));
        } else { // yearly
            const year = parseInt(dateString.slice(0, 4), 10);
            start = new Date(Date.UTC(year, 0, 1, 0, 0, 0, 0));
            end = new Date(Date.UTC(year, 11, 31, 23, 59, 59, 999));
        }
        return { start, end };
    };
    
    const formatDate = (timestamp) => {
        if (!timestamp || !timestamp.toDate) return '...';
        return timestamp.toDate().toLocaleString('th-TH', {
            year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
        });
    };
    
    const handlePrint = () => { window.print(); };

    return (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[60] flex items-center justify-center p-4 print:p-0 print:bg-white print:block" onClick={onClose}>
            <div className="bg-gray-800 border border-emerald-500/50 rounded-2xl w-full max-w-4xl h-[90vh] flex flex-col shadow-2xl print:border-none print:shadow-none print:w-full print:h-auto print:block" onClick={(e) => e.stopPropagation()}>
                <header className="flex items-center justify-between p-4 border-b border-white/10 flex-shrink-0 print:hidden">
                    <h2 className="text-2xl font-bold text-white flex items-center gap-3"><Icon name="BookOpen" />รายงานการออมทรัพย์</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-white"><Icon name="X" size={28} /></button>
                </header>
                
                <div className="p-4 flex flex-wrap items-end gap-4 border-b border-white/10 flex-shrink-0 print:hidden">
                    <div>
                        <label className="text-sm text-gray-300">ประเภทรายงาน</label>
                        <select value={reportType} onChange={e => setReportType(e.target.value)} className="w-full bg-gray-700/50 p-2 rounded-lg border border-gray-600 text-white h-[42px]">
                            <option value="daily">รายวัน</option>
                            <option value="monthly">รายเดือน</option>
                            <option value="yearly">รายปี</option>
                        </select>
                    </div>
                     <div>
                        <label className="text-sm text-gray-300">เลือก {reportType === 'daily' ? 'วันที่' : reportType === 'monthly' ? 'เดือน' : 'ปี'}</label>
                        <input 
                            type={ reportType === 'daily' ? 'date' : reportType === 'monthly' ? 'month' : 'number' }
                            value={ reportType === 'yearly' ? selectedDate.slice(0, 4) : reportType === 'monthly' ? selectedDate.slice(0, 7) : selectedDate }
                            onChange={e => {
                                const val = e.target.value;
                                if (reportType === 'yearly') { setSelectedDate(`${val}-01-01`); } 
                                else if (reportType === 'monthly') { setSelectedDate(`${val}-01`); } 
                                else { setSelectedDate(val); }
                            }}
                            className="w-full bg-gray-700/50 p-2 rounded-lg border border-gray-600 text-white h-[42px]"
                            placeholder="YYYY"
                            min={reportType === 'yearly' ? '2020' : undefined}
                        />
                    </div>
                    <button onClick={handleFetchReport} disabled={isLoading} className="px-6 py-2 bg-emerald-600 hover:bg-emerald-700 rounded-lg h-[42px] disabled:bg-gray-500 flex items-center gap-2">
                        {isLoading ? <Icon name="Loader2" className="animate-spin"/> : <Icon name="Search" />}
                        {isLoading ? 'กำลังโหลด...' : 'ค้นหา'}
                    </button>
                </div>

                <div className="p-6 flex-grow overflow-auto print:p-0">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                        <div className="bg-green-500/10 p-4 rounded-lg"><p className="text-sm text-green-300">ยอดฝากรวม</p><p className="text-3xl font-bold text-white">{summary.deposits.toLocaleString('th-TH')} ฿</p></div>
                        <div className="bg-red-500/10 p-4 rounded-lg"><p className="text-sm text-red-300">ยอดถอนรวม</p><p className="text-3xl font-bold text-white">{summary.withdrawals.toLocaleString('th-TH')} ฿</p></div>
                        <div className="bg-sky-500/10 p-4 rounded-lg"><p className="text-sm text-sky-300">ผลต่าง (ฝาก-ถอน)</p><p className="text-3xl font-bold text-white">{(summary.deposits - summary.withdrawals).toLocaleString('th-TH')} ฿</p></div>
                    </div>
                    <div className="bg-gray-900/50 rounded-xl p-4 flex-grow overflow-y-auto print:bg-transparent">
                         {isLoading ? (
                            <div className="flex items-center justify-center h-full"><Icon name="Loader2" className="animate-spin text-emerald-400" size={32} /></div>
                        ) : (
                            <ul className="space-y-2">
                                {transactions.length > 0 ? transactions.map(t => (
                                    <li key={t.id} className={`flex justify-between items-center p-2 rounded-md ${t.type === 'deposit' ? 'bg-green-500/10 print:border-b' : 'bg-red-500/10 print:border-b'}`}>
                                        <div>
                                            <p className={`font-bold ${t.type === 'deposit' ? 'text-green-300' : 'text-red-300'}`}>{t.type === 'deposit' ? 'ฝากเงิน' : 'ถอนเงิน'}</p>
                                            <p className="text-xs text-gray-200">{t.studentName} ({t.grade})</p>
                                            <p className="text-xs text-gray-400">{formatDate(t.timestamp)}</p>
                                        </div>
                                        <p className={`font-mono text-lg ${t.type === 'deposit' ? 'text-green-300' : 'text-red-300'}`}>
                                           {t.type === 'deposit' ? '+' : '-'}{t.amount.toLocaleString('th-TH', {minimumFractionDigits: 2})}
                                        </p>
                                    </li>
                                )) : (
                                    <div className="flex items-center justify-center h-48 text-gray-500"><p>ไม่พบข้อมูลในช่วงเวลาที่เลือก</p></div>
                                )}
                            </ul>
                        )}
                    </div>
                </div>
                 <footer className="p-3 border-t border-white/10 flex justify-end print:hidden">
                    <button onClick={handlePrint} className="flex items-center gap-2 py-2 px-6 bg-teal-500 hover:bg-teal-600 text-white font-bold rounded-lg transition-colors">
                        <Icon name="Printer" size={18} />
                        พิมพ์รายงาน
                    </button>
                </footer>
            </div>
        </div>
    );
};

export default SavingsReportModal;