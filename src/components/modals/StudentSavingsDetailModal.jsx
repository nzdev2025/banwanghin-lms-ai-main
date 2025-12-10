// src/components/modals/StudentSavingsDetailModal.jsx (The "Text Color Polish" Version)

import React from 'react';
import { collection, onSnapshot, query, orderBy, doc, serverTimestamp, runTransaction } from 'firebase/firestore';
import { db, logActivity, appId } from '../../firebase/firebase';
import Icon from '../../icons/Icon';

const StudentSavingsDetailModal = ({ student, grade, onClose }) => {
    const [transactions, setTransactions] = React.useState([]);
    const [balance, setBalance] = React.useState(0);
    const [amount, setAmount] = React.useState('');
    const [type, setType] = React.useState('deposit');
    const [isLoading, setIsLoading] = React.useState(true);
    const [isSaving, setIsSaving] = React.useState(false);

    const savingsBasePath = `artifacts/${appId}/public/data/savings/${grade}/students/${student.id}`;

    React.useEffect(() => {
        const transactionsQuery = query(collection(db, `${savingsBasePath}/transactions`), orderBy("timestamp", "desc"));
        const unsubTransactions = onSnapshot(transactionsQuery, (snapshot) => {
            setTransactions(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
            setIsLoading(false);
        });

        const summaryDocRef = doc(db, savingsBasePath);
        const unsubSummary = onSnapshot(summaryDocRef, (doc) => {
            setBalance(doc.exists() ? doc.data().totalBalance : 0);
        });

        return () => {
            unsubTransactions();
            unsubSummary();
        };
    }, [savingsBasePath]);

    const handleTransaction = async (e) => {
        e.preventDefault();
        const transactionAmount = parseFloat(amount);
        if (isNaN(transactionAmount) || transactionAmount <= 0) return;
        if (type === 'withdraw' && transactionAmount > balance) {
            alert("ยอดเงินไม่เพียงพอสำหรับการถอน");
            return;
        }

        setIsSaving(true);
        try {
            const summaryDocRef = doc(db, savingsBasePath);
            const transactionColRef = collection(db, `${savingsBasePath}/transactions`);
            const newTransactionRef = doc(transactionColRef);

            await runTransaction(db, async (transaction) => {
                const summaryDoc = await transaction.get(summaryDocRef);
                const currentBalance = summaryDoc.exists() ? summaryDoc.data().totalBalance : 0;
                const newBalance = type === 'deposit' 
                    ? currentBalance + transactionAmount
                    : currentBalance - transactionAmount;

                transaction.set(newTransactionRef, {
                    amount: transactionAmount,
                    type: type,
                    timestamp: serverTimestamp()
                });

                transaction.set(summaryDocRef, {
                    totalBalance: newBalance,
                    lastUpdated: serverTimestamp()
                }, { merge: true });
            });
            
            logActivity('SAVINGS_TRANSACTION', `ทำรายการ ${type} จำนวน ${transactionAmount} บาท ของ ${student.firstName}`);
            setAmount('');
            onClose(); // Close modal on success

        } catch (error) {
            console.error("Transaction failed: ", error);
        } finally {
            setIsSaving(false);
        }
    };
    
    const formatDate = (timestamp) => {
        if (!timestamp || !timestamp.toDate) return '...';
        return timestamp.toDate().toLocaleString('th-TH', {
            year: 'numeric', month: 'short', day: 'numeric',
            hour: '2-digit', minute: '2-digit'
        });
    };

    return (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[250] flex items-center justify-center p-4" onClick={onClose}>
            <div className="bg-gray-800 border border-emerald-500/50 rounded-2xl w-full max-w-lg h-[85vh] flex flex-col shadow-2xl" onClick={(e) => e.stopPropagation()}>
                <header className="p-4 border-b border-white/10 flex-shrink-0">
                    <h3 className="text-xl font-bold text-white">{student.firstName} {student.lastName}</h3>
                    <p className="text-emerald-300">ยอดเงินคงเหลือ: <span className="font-mono text-2xl">{balance.toFixed(2)}</span> บาท</p>
                </header>

                <div className="p-6 flex-shrink-0">
                    <form onSubmit={handleTransaction} className="flex items-end gap-3">
                        <div className="flex-grow">
                            <label className="block text-sm font-medium text-gray-300 mb-1">จำนวนเงิน</label>
                            {/* --- [1] เพิ่ม text-white เพื่อให้ตัวเลขที่พิมพ์เป็นสีขาว --- */}
                            <input type="number" value={amount} onChange={e => setAmount(e.target.value)} className="w-full bg-gray-700/50 p-2 rounded-lg border border-gray-600 text-white" placeholder="0.00" required />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-1">รายการ</label>
                            <select value={type} onChange={e => setType(e.target.value)} className="w-full bg-gray-700/50 p-2 rounded-lg border border-gray-600 h-[42px] text-white">
                                <option value="deposit">ฝากเงิน</option>
                                <option value="withdraw">ถอนเงิน</option>
                            </select>
                        </div>
                        <button type="submit" disabled={isSaving} className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 rounded-lg h-[42px] disabled:bg-gray-500 flex-shrink-0">
                           {isSaving ? <Icon name="Loader2" className="animate-spin"/> : 'ยืนยัน'}
                        </button>
                    </form>
                </div>

                <div className="px-6 pb-6 flex-grow flex flex-col min-h-0">
                    {/* --- [2] เพิ่ม text-white ให้กับหัวข้อ --- */}
                    <h4 className="text-lg font-bold mb-2 flex-shrink-0 text-white">ประวัติความเคลื่อนไหว</h4>
                    <div className="bg-gray-900/50 rounded-xl p-4 flex-grow overflow-y-auto">
                        {isLoading ? (
                            <div className="flex items-center justify-center h-full">
                                <Icon name="Loader2" className="animate-spin text-emerald-400" size={32} />
                            </div>
                        ) : (
                            <ul className="space-y-2">
                                {transactions.length > 0 ? transactions.map(t => (
                                    <li key={t.id} className={`flex justify-between items-center p-2 rounded-md ${t.type === 'deposit' ? 'bg-green-500/10' : 'bg-red-500/10'}`}>
                                        <div>
                                            <p className={`font-bold ${t.type === 'deposit' ? 'text-green-300' : 'text-red-300'}`}>{t.type === 'deposit' ? 'ฝากเงิน' : 'ถอนเงิน'}</p>
                                            <p className="text-xs text-gray-400">{formatDate(t.timestamp)}</p>
                                        </div>
                                        <p className={`font-mono text-lg ${t.type === 'deposit' ? 'text-green-300' : 'text-red-300'}`}>
                                           {t.type === 'deposit' ? '+' : '-'}{t.amount.toFixed(2)}
                                        </p>
                                    </li>
                                )) : (
                                    <div className="flex items-center justify-center h-full text-gray-500">
                                        <p>ยังไม่มีรายการเคลื่อนไหว</p>
                                    </div>
                                )}
                            </ul>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default StudentSavingsDetailModal;