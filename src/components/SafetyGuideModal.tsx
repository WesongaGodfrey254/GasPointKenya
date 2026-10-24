import React from 'react';
import { motion } from 'motion/react';
import { Flame, ShieldCheck, AlertTriangle, CheckCircle, X, Wrench, Wind } from 'lucide-react';

interface SafetyGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SafetyGuideModal: React.FC<SafetyGuideModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-2xl bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-100 flex flex-col max-h-[90vh]"
      >
        <div className="bg-gradient-to-r from-amber-600 via-orange-600 to-red-600 text-white px-6 py-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/20 flex items-center justify-center backdrop-blur-xs">
              <Flame className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-base">LPG Cooking Gas Safety & Compliance Guide</h3>
              <p className="text-xs text-amber-100">
                Official Kenya EPRA & KEBS Domestic Cooking Safety Standards
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/10"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto space-y-6 text-xs text-slate-700">
          {/* Rule 1: Upright Storage */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex gap-4">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div className="space-y-1">
              <h4 className="font-bold text-slate-900 text-sm">
                1. Always Store & Use Cylinders Upright
              </h4>
              <p className="text-slate-600 leading-relaxed">
                LPG cylinders must always be kept vertically on a firm, flat surface. Never tilt or place a cylinder horizontally to "get more gas" — liquid LPG can escape through the regulator, causing sudden flare-ups.
              </p>
            </div>
          </div>

          {/* Rule 2: Soapy Water Bubble Leak Test */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex gap-4">
            <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-800 flex items-center justify-center shrink-0">
              <Wrench className="w-5 h-5" />
            </div>
            <div className="space-y-1">
              <h4 className="font-bold text-slate-900 text-sm">
                2. The Soapy Water Bubble Leak Test
              </h4>
              <p className="text-slate-600 leading-relaxed">
                Never use an open flame, matchbox, or lighter to check for gas leaks! Apply soapy water sponge along the regulator valve and hose joint. If growing bubbles appear, there is a leak. Turn off the regulator immediately.
              </p>
            </div>
          </div>

          {/* Rule 3: Adequate Ventilation */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex gap-4">
            <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-800 flex items-center justify-center shrink-0">
              <Wind className="w-5 h-5" />
            </div>
            <div className="space-y-1">
              <h4 className="font-bold text-slate-900 text-sm">
                3. Well-Ventilated Kitchen Environment
              </h4>
              <p className="text-slate-600 leading-relaxed">
                Ensure good air circulation in your kitchen. LPG is heavier than air and sinks to the floor if a leak occurs. Keep windows open while cooking and never store cylinders in enclosed cabinets with no ventilation slots.
              </p>
            </div>
          </div>

          {/* Rule 4: Hose & Regulator Replacement Cycle */}
          <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 flex gap-4">
            <div className="w-10 h-10 rounded-xl bg-amber-200 text-amber-900 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div className="space-y-1">
              <h4 className="font-bold text-amber-950 text-sm">
                4. Mandatory Hose & Regulator Replacement
              </h4>
              <p className="leading-relaxed text-amber-900">
                EPRA regulations mandate replacing rubber gas hoses every <strong>2 to 3 years</strong> or immediately when surface cracks appear. Regulators should be replaced every 5 years. Always secure hoses with stainless-steel jubilee hose clips.
              </p>
            </div>
          </div>

          {/* Emergency Procedure */}
          <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-red-900 space-y-2">
            <h4 className="font-extrabold text-sm flex items-center gap-1.5 text-red-800">
              <AlertTriangle className="w-4 h-4" />
              <span>What to Do If You Smell Gas</span>
            </h4>
            <ol className="list-decimal pl-5 space-y-1 text-slate-700">
              <li>Turn off the regulator knob/valve immediately.</li>
              <li>Extinguish all naked flames and put out incense/candles.</li>
              <li>Open all kitchen doors and windows wide for cross-ventilation.</li>
              <li><strong>Do NOT</strong> touch any electrical light switches or unplug appliances (a spark can ignite gas).</li>
              <li>Evacuate the area and contact your GasPoint depot or emergency services.</li>
            </ol>
          </div>
        </div>

        <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-slate-900 text-white font-bold text-xs"
          >
            I Understand the Safety Protocols
          </button>
        </div>
      </motion.div>
    </div>
  );
};
