import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { EmailNotification } from '../types/index.ts';
import { Mail, CheckCircle2, Send, RefreshCw, X, ShieldAlert, Sparkles } from 'lucide-react';
import { useAuth } from '../context/AuthContext.tsx';

interface EmailCenterModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const EmailCenterModal: React.FC<EmailCenterModalProps> = ({ isOpen, onClose }) => {
  const { currentUser } = useAuth();
  const [emails, setEmails] = useState<EmailNotification[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedEmail, setSelectedEmail] = useState<EmailNotification | null>(null);

  // Test email sender
  const [isSendingTest, setIsSendingTest] = useState(false);
  const [testRecipient, setTestRecipient] = useState(currentUser?.email || '');

  const fetchEmails = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (currentUser?.email) params.set('email', currentUser.email);
      if (currentUser?.role) params.set('role', currentUser.role);
      if (currentUser?.id) params.set('userId', String(currentUser.id));

      const res = await fetch(`/api/emails?${params.toString()}`, {
        headers: {
          'x-user-email': currentUser?.email || '',
          'x-user-role': currentUser?.role || '',
          'x-user-id': String(currentUser?.id || ''),
        },
      });
      if (res.ok) {
        const data = await res.json();
        setEmails(data);
        if (data.length > 0) {
          setSelectedEmail(data[0]);
        } else {
          setSelectedEmail(null);
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      if (currentUser?.email) {
        setTestRecipient(currentUser.email);
      }
      fetchEmails();
    }
  }, [isOpen, currentUser]);

  if (!isOpen) return null;

  const handleSendTestNotification = async () => {
    setIsSendingTest(true);
    try {
      const finalRecipient = currentUser?.role === 'super_admin' ? (testRecipient || currentUser.email) : currentUser?.email;
      const res = await fetch('/api/emails/send-test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-email': currentUser?.email || '',
          'x-user-role': currentUser?.role || '',
          'x-user-id': String(currentUser?.id || ''),
        },
        body: JSON.stringify({
          recipientEmail: finalRecipient,
          recipientName: currentUser?.fullName || 'GasPoint User',
          subject: `Automated Test Alert: GasPoint Delivery Notification`,
          content: `This is an automated system verification email for ${finalRecipient}. Your account and notification preferences are active. All order dispatches and approval updates are logged.`,
        }),
      });
      if (res.ok) {
        await fetchEmails();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsSendingTest(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-4xl bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-100 flex flex-col h-[85vh]"
      >
        {/* Header */}
        <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <Mail className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-base">
                  {currentUser?.role === 'super_admin'
                    ? 'GasPoint Automated Email Notification Center (Super Admin View)'
                    : currentUser?.role === 'gas_owner'
                    ? 'Gas Provider Notification Inbox'
                    : 'Customer Notification Inbox'}
                </h3>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  currentUser?.role === 'super_admin'
                    ? 'bg-amber-400 text-slate-950'
                    : currentUser?.role === 'gas_owner'
                    ? 'bg-emerald-600 text-white'
                    : 'bg-slate-700 text-slate-200'
                }`}>
                  {currentUser?.role === 'super_admin'
                    ? 'All System Emails'
                    : currentUser?.role === 'gas_owner'
                    ? 'Station Specific'
                    : 'Personal'}
                </span>
              </div>
              <p className="text-xs text-slate-400">
                {currentUser?.role === 'super_admin'
                  ? 'Complete platform audit log of all transactional emails sent across GasPoint'
                  : currentUser?.role === 'gas_owner'
                  ? 'Transactional emails, activation notices, orders, and receipts related to your station'
                  : 'Order receipts, live delivery status updates, and account notifications'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={fetchEmails}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Split Panel: Inbox List & Preview */}
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
          {/* Email List Sidebar */}
          <div className="w-full md:w-80 border-r border-slate-200 overflow-y-auto bg-slate-50/50 p-3 space-y-2">
            <div className="p-2 flex items-center justify-between text-xs text-slate-500 font-bold uppercase tracking-wider">
              <span>{currentUser?.role === 'super_admin' ? `All Emails (${emails.length})` : `My Emails (${emails.length})`}</span>
              <button
                onClick={handleSendTestNotification}
                disabled={isSendingTest}
                className="text-[10px] text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-md hover:bg-emerald-200"
              >
                {isSendingTest ? 'Sending...' : '+ Test Notification'}
              </button>
            </div>

            {emails.length === 0 ? (
              <div className="py-12 text-center text-slate-400 text-xs">No emails recorded yet.</div>
            ) : (
              emails.map((em) => (
                <div
                  key={em.id}
                  onClick={() => setSelectedEmail(em)}
                  className={`cursor-pointer p-3 rounded-xl border transition-all text-xs ${
                    selectedEmail?.id === em.id
                      ? 'bg-white border-emerald-600 shadow-xs ring-1 ring-emerald-600/20'
                      : 'bg-white border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between gap-1 mb-1">
                    <span className="font-bold text-slate-900 truncate">{em.recipientName || em.recipientEmail}</span>
                    <span className="text-[10px] text-slate-400 shrink-0">
                      {new Date(em.sentAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <div className="font-medium text-slate-800 line-clamp-1">{em.subject}</div>
                  <div className="text-[11px] text-slate-500 line-clamp-2 mt-1">{em.content}</div>
                </div>
              ))
            )}
          </div>

          {/* Email Body Preview */}
          <div className="flex-1 p-6 overflow-y-auto bg-white">
            {selectedEmail ? (
              <div className="space-y-6">
                <div className="pb-4 border-b border-slate-100 space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono font-bold bg-emerald-100 text-emerald-800 px-2.5 py-0.5 rounded-full">
                      {selectedEmail.templateType}
                    </span>
                    <span className="text-xs text-slate-400">
                      Sent on {new Date(selectedEmail.sentAt).toLocaleString()}
                    </span>
                  </div>
                  <h2 className="text-lg font-bold text-slate-900">{selectedEmail.subject}</h2>

                  <div className="text-xs text-slate-600 space-y-0.5 pt-1">
                    <div>
                      From: <strong className="text-slate-800">GasPoint Automated Mailer &lt;no-reply@gaspoint.co.ke&gt;</strong>
                    </div>
                    <div>
                      To: <strong className="text-slate-800">{selectedEmail.recipientName}</strong> &lt;{selectedEmail.recipientEmail}&gt;
                    </div>
                  </div>
                </div>

                {/* Email Body Card */}
                <div className="rounded-2xl border border-slate-200 p-6 bg-slate-50/50 space-y-4">
                  <div className="flex items-center gap-2 pb-3 border-b border-slate-200 text-xs font-bold text-emerald-800">
                    <Sparkles className="w-4 h-4 text-emerald-600" />
                    <span>Official GasPoint Transactional Notification</span>
                  </div>

                  <div className="text-slate-800 text-sm leading-relaxed whitespace-pre-line">
                    {selectedEmail.content}
                  </div>

                  <div className="pt-4 border-t border-slate-200 text-[11px] text-slate-400 space-y-1">
                    <div>GasPoint Kenya Ltd • Commercial Safety & Delivery Dispatch</div>
                    <div>Energy and Petroleum Regulatory Authority (EPRA) Compliant</div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="py-20 text-center text-slate-400 text-sm">
                Select an email notification on the left to read its content.
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
};
