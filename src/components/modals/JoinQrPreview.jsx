import React from 'react';
import Icon from '../../icons/Icon';

const JoinQrPreview = ({ qrUrl, description = 'สแกน QR เพื่อเข้าห้องทันที' }) => {
  const [expanded, setExpanded] = React.useState(false);
  if (!qrUrl) return null;

  return (
    <>
      <button
        type="button"
        onClick={() => setExpanded(true)}
        className="flex flex-wrap items-center gap-3 rounded-xl border border-white/10 bg-white/5 p-3 text-left transition hover:border-white/30"
      >
        <img
          src={qrUrl}
          alt="QR สำหรับเข้าร่วม Lightning Quiz"
          className="h-28 w-28 rounded-lg border border-white/10 bg-white/70 p-1"
        />
        <div className="text-xs text-white/70">
          <p className="font-semibold text-white">สแกน QR เพื่อเข้าห้องทันที</p>
          <p>{description}</p>
          <p className="text-amber-200 mt-1">คลิกเพื่อขยาย</p>
        </div>
      </button>

      {expanded && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-[130] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
        >
          <div className="relative max-w-2xl w-full rounded-3xl border border-white/20 bg-[#0b1327] p-4 shadow-2xl">
            <button
              type="button"
              aria-label="ปิดภาพใหญ่"
              onClick={() => setExpanded(false)}
              className="absolute right-3 top-3 rounded-full border border-white/20 bg-white/10 p-2 text-white/80 hover:bg-white/20"
            >
              <Icon name="X" size={16} />
            </button>
            <div className="flex flex-col items-center gap-3">
              <img
                src={qrUrl}
                alt="QR ขนาดใหญ่"
                className="w-full max-w-md rounded-2xl border border-white/20 bg-white p-4 shadow-lg"
              />
              <p className="text-sm text-white/80 text-center">{description}</p>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default JoinQrPreview;
