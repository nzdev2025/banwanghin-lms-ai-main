import React from 'react';
import Icon from '../../icons/Icon';

const ImportStudentsModal = ({ onClose, onImport }) => {
    const [file, setFile] = React.useState(null);
    const [isProcessing, setIsProcessing] = React.useState(false);
    const [error, setError] = React.useState('');
    const fileInputRef = React.useRef(null);

    const handleFileChange = (event) => {
        const selectedFile = event.target.files[0];
        if (selectedFile && (selectedFile.type === 'text/csv' || selectedFile.name.endsWith('.csv'))) {
            setFile(selectedFile);
            setError('');
        } else {
            setFile(null);
            setError('กรุณาเลือกไฟล์ .csv เท่านั้น');
        }
    };

    const handleProcessFile = () => {
        if (!file) {
            setError('กรุณาเลือกไฟล์ก่อน');
            return;
        }
        if (!window.Papa) {
            setError('Library สำหรับประมวลผลไฟล์ยังไม่พร้อม โปรดรอสักครู่แล้วลองอีกครั้ง');
            return;
        }

        setIsProcessing(true);
        window.Papa.parse(file, {
            header: true,
            skipEmptyLines: true,
            complete: (results) => {
                const requiredHeaders = ['studentNumber', 'firstName', 'lastName'];
                const actualHeaders = results.meta.fields;
                const hasAllHeaders = requiredHeaders.every(h => actualHeaders.includes(h));

                if (!hasAllHeaders) {
                    setError(`ไฟล์ CSV ต้องมีคอลัมน์: ${requiredHeaders.join(', ')}`);
                    setIsProcessing(false);
                    return;
                }

                const studentsData = results.data.map(row => ({
                    studentNumber: parseInt(row.studentNumber, 10),
                    firstName: row.firstName.trim(),
                    lastName: row.lastName.trim(),
                })).filter(s => !isNaN(s.studentNumber) && s.firstName && s.lastName);

                onImport(studentsData);
                setIsProcessing(false);
            },
            error: (err) => {
                setError('เกิดข้อผิดพลาดในการอ่านไฟล์: ' + err.message);
                setIsProcessing(false);
            }
        });
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-gray-800 border border-white/20 rounded-2xl p-6 w-full max-w-lg shadow-2xl">
                <h3 className="text-xl font-bold mb-4">นำเข้ารายชื่อนักเรียนจากไฟล์ CSV</h3>
                <div className="bg-amber-500/10 border border-amber-500/30 text-amber-300 text-sm rounded-lg p-3 mb-4">
                    <p className="font-bold">คำแนะนำ:</p>
                    <ul className="list-disc list-inside mt-1">
                        <li>ไฟล์ต้องเป็นประเภท .csv</li>
                        <li>ต้องมีคอลัมน์ `studentNumber`, `firstName`, `lastName`</li>
                        <li>แถวแรกสุด (Header) ต้องเป็นชื่อคอลัมน์ตามลำดับ</li>
                    </ul>
                </div>

                <input type="file" accept=".csv" onChange={handleFileChange} ref={fileInputRef} className="hidden" />
                <button onClick={() => fileInputRef.current.click()} className="w-full text-center p-4 border-2 border-dashed border-gray-600 rounded-lg hover:bg-gray-700/50 transition-colors">
                    {file ? `เลือกไฟล์แล้ว: ${file.name}` : 'คลิกเพื่อเลือกไฟล์'}
                </button>

                {error && <p className="text-red-400 text-sm mt-2">{error}</p>}

                <div className="flex justify-end gap-4 mt-6">
                    <button type="button" onClick={onClose} className="py-2 px-4 text-gray-300 hover:text-white">ยกเลิก</button>
                    <button onClick={handleProcessFile} disabled={!file || isProcessing} className="flex items-center gap-2 py-2 px-4 bg-teal-500 hover:bg-teal-600 text-white font-bold rounded-lg transition-colors disabled:bg-gray-500 disabled:cursor-not-allowed">
                        {isProcessing ? <Icon name="Loader2" className="animate-spin" size={16}/> : <Icon name="Upload" size={16}/>}
                        {isProcessing ? 'กำลังประมวลผล...' : 'นำเข้าข้อมูล'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ImportStudentsModal;
