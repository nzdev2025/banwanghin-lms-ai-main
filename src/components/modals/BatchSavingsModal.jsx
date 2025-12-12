import React from 'react';
import { collection, doc, serverTimestamp, writeBatch } from 'firebase/firestore';
import { db, logActivity, appId } from '../../firebase/firebase';
import Icon from '../../icons/Icon';
import { useToast } from '../../context/ToastContext';

const BatchSavingsModal = ({ students, grade, type, onClose, savings }) => {
    const toast = useToast();
    const [amount, setAmount] = React.useState('');
    const [selectedStudents, setSelectedStudents] = React.useState(
        students.reduce((acc, s) => ({ ...acc, [s.id]: true }), {})
    );
    const [isSaving, setIsSaving] = React.useState(false);
    const [showSuccess, setShowSuccess] = React.useState(false);

    const selectedCount = Object.values(selectedStudents).filter(Boolean).length;

    const handleToggleAll = (checked) => {
        const newSelection = {};
        students.forEach(s => { newSelection[s.id] = checked; });
        setSelectedStudents(newSelection);
    };

    const handleToggleStudent = (studentId) => {
        setSelectedStudents(prev => ({
            ...prev,
            [studentId]: !prev[studentId]
        }));
    };

    const handleBatchTransaction = async (e) => {
        e.preventDefault();
        const transactionAmount = parseFloat(amount);
        if (isNaN(transactionAmount) || transactionAmount <= 0) {
            toast.warning('กรุณาใส่จำนวนเงินที่ถูกต้อง');
            return;
        }
        if (selectedCount === 0) {
            toast.warning('กรุณาเลือกนักเรียนอย่างน้อย 1 คน');
            return;
        }

        // ตรวจสอบยอดเงินก่อนถอน
        if (type === 'withdraw') {
            const studentsWithInsufficientFunds = students.filter(s => {
                if (!selectedStudents[s.id]) return false;
                const balance = savings[s.id]?.totalBalance || 0;
                return balance < transactionAmount;
            });

            if (studentsWithInsufficientFunds.length > 0) {
                toast.error(`นักเรียน ${studentsWithInsufficientFunds.length} คน มียอดเงินไม่เพียงพอ`);
                return;
            }

            if (!window.confirm(`ยืนยันการถอนเงิน ${transactionAmount.toFixed(2)} บาท จากนักเรียน ${selectedCount} คน?`)) {
                return;
            }
        }

        setIsSaving(true);
        try {
            const batch = writeBatch(db);
            const selectedStudentsList = students.filter(s => selectedStudents[s.id]);

            for (const student of selectedStudentsList) {
                const savingsBasePath = `artifacts/${appId}/public/data/savings/${grade}/students/${student.id}`;
                const summaryDocRef = doc(db, savingsBasePath);
                const transactionColRef = collection(db, `${savingsBasePath}/transactions`);
                const newTransactionRef = doc(transactionColRef);

                const currentBalance = savings[student.id]?.totalBalance || 0;
                const newBalance = type === 'deposit'
                    ? currentBalance + transactionAmount
                    : currentBalance - transactionAmount;

                batch.set(newTransactionRef, {
                    amount: transactionAmount,
                    type: type,
                    timestamp: serverTimestamp()
                });

                batch.set(summaryDocRef, {
                    totalBalance: newBalance,
                    lastUpdated: serverTimestamp()
                }, { merge: true });
            }

            await batch.commit();

            logActivity('BATCH_SAVINGS', `ทำรายการ ${type} จำนวน ${transactionAmount} บาท ให้นักเรียน ${selectedCount} คน ชั้น ป.${grade.replace('p', '')}`);

            // แสดง feedback
            setShowSuccess(true);
            setTimeout(() => {
                setShowSuccess(false);
                onClose();
            }, 1500);

        } catch (error) {
            console.error("Batch transaction failed: ", error);
            toast.error("เกิดข้อผิดพลาด: " + error.message);
        } finally {
            setIsSaving(false);
        }
    };

    // Success overlay
    if (showSuccess) {
        return (
            <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[260] flex items-center justify-center p-4">
                <div className="bg-gray-800 border border-emerald-500 rounded-2xl p-8 text-center shadow-2xl">
                    <Icon name="CheckCircle" className="text-emerald-400 mx-auto mb-4" size={64} />
                    <p className="text-2xl font-bold text-white">ทำรายการสำเร็จ!</p>
                    <p className="text-gray-400 mt-2">
                        {type === 'deposit' ? 'ฝากเงิน' : 'ถอนเงิน'} ให้นักเรียน {selectedCount} คน เรียบร้อยแล้ว
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[260] flex items-center justify-center p-4" onClick={onClose}>
            <div className="bg-gray-800 border border-emerald-500/50 rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl" onClick={(e) => e.stopPropagation()}>
                <header className="p-4 border-b border-white/10 flex-shrink-0 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${type === 'deposit' ? 'bg-emerald-500/20' : 'bg-rose-500/20'}`}>
                            <Icon name={type === 'deposit' ? 'ArrowDownLeft' : 'ArrowUpRight'}
                                className={type === 'deposit' ? 'text-emerald-400' : 'text-rose-400'} size={24} />
                        </div>
                        <div>
                            <h3 className="text-xl font-bold text-white">
                                {type === 'deposit' ? 'ฝากเงินทั้งชั้น' : 'ถอนเงินทั้งชั้น'}
                            </h3>
                            <p className="text-sm text-gray-400">ชั้น ป.{grade.replace('p', '')} • เลือกแล้ว {selectedCount} คน</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-white">
                        <Icon name="X" size={24} />
                    </button>
                </header>

                <div className="p-4 border-b border-white/10 flex-shrink-0">
                    <form onSubmit={handleBatchTransaction} className="flex items-end gap-3">
                        <div className="flex-grow">
                            <label className="block text-sm font-medium text-gray-300 mb-1">
                                จำนวนเงิน (บาท) - ใส่ค่าเดียวสำหรับทุกคน
                            </label>
                            <input
                                type="number"
                                value={amount}
                                onChange={e => setAmount(e.target.value)}
                                className="w-full bg-gray-700/50 p-3 rounded-lg border border-gray-600 text-white text-lg"
                                placeholder="เช่น 10.00"
                                step="0.01"
                                min="0.01"
                                required
                            />
                        </div>
                        <button
                            type="submit"
                            disabled={isSaving || selectedCount === 0}
                            className={`px-6 py-3 rounded-lg font-bold disabled:opacity-50 flex items-center gap-2 ${type === 'deposit'
                                ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                                : 'bg-rose-600 hover:bg-rose-700 text-white'
                                }`}
                        >
                            {isSaving ? (
                                <Icon name="Loader2" className="animate-spin" size={20} />
                            ) : (
                                <Icon name={type === 'deposit' ? 'Plus' : 'Minus'} size={20} />
                            )}
                            {isSaving ? 'กำลังบันทึก...' : type === 'deposit' ? 'ฝากเงิน' : 'ถอนเงิน'}
                        </button>
                    </form>
                </div>

                <div className="p-4 flex-grow overflow-auto">
                    <div className="flex items-center justify-between mb-3">
                        <span className="text-sm text-gray-400">เลือกนักเรียน</span>
                        <label className="flex items-center gap-2 text-sm text-gray-300 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={selectedCount === students.length}
                                onChange={(e) => handleToggleAll(e.target.checked)}
                                className="accent-emerald-400 w-4 h-4"
                            />
                            เลือกทั้งหมด
                        </label>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {students.map(student => {
                            const balance = savings[student.id]?.totalBalance || 0;
                            const isSelected = selectedStudents[student.id];
                            const hasInsufficientFunds = type === 'withdraw' && amount && balance < parseFloat(amount);

                            return (
                                <label
                                    key={student.id}
                                    className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors ${isSelected
                                        ? hasInsufficientFunds
                                            ? 'bg-rose-500/20 border border-rose-500/50'
                                            : 'bg-emerald-500/10 border border-emerald-500/30'
                                        : 'bg-gray-700/30 border border-transparent hover:bg-gray-700/50'
                                        }`}
                                >
                                    <input
                                        type="checkbox"
                                        checked={isSelected}
                                        onChange={() => handleToggleStudent(student.id)}
                                        className="accent-emerald-400 w-5 h-5"
                                    />
                                    <div className="flex-grow min-w-0">
                                        <p className="font-medium text-white truncate">
                                            {student.studentNumber}. {student.firstName} {student.lastName}
                                        </p>
                                        <p className={`text-sm ${hasInsufficientFunds ? 'text-rose-400' : 'text-gray-400'}`}>
                                            ยอดปัจจุบัน: {balance.toFixed(2)} บาท
                                            {hasInsufficientFunds && ' (ไม่พอ)'}
                                        </p>
                                    </div>
                                </label>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default BatchSavingsModal;
