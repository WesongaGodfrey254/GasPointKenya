import React, { useState, useEffect } from 'react';
import { GasStation, Order, EmailNotification, User } from '../types/index.ts';
import { useAuth } from '../context/AuthContext.tsx';
import {
  ShieldCheck,
  Building2,
  TrendingUp,
  Clock,
  Check,
  X,
  Trash2,
  AlertTriangle,
  Mail,
  RefreshCw,
  Search,
  CheckCircle2,
  Users,
  Store,
  DollarSign,
  AlertCircle,
} from 'lucide-react';

export const SuperAdminDashboard: React.FC = () => {
  const { currentUser } = useAuth();
  const [stations, setStations] = useState<GasStation[]>([]);
  const [analytics, setAnalytics] = useState<any>(null);
  const [emails, setEmails] = useState<EmailNotification[]>([]);
  const [usersList, setUsersList] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'approvals' | 'stations' | 'users' | 'analytics' | 'emails'>('approvals');

  // Action status message
  const [actionMessage, setActionMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Rejection modal
  const [rejectingStation, setRejectingStation] = useState<GasStation | null>(null);
  const [rejectionReason, setRejectionReason] = useState('Missing physical EPRA storage clearance certificate.');

  const fetchAllData = async () => {
    setLoading(true);
    try {
      const [stRes, anRes, emRes, usrRes] = await Promise.all([
        fetch('/api/stations?all=true'),
        fetch('/api/analytics/platform'),
        fetch('/api/emails?role=super_admin', {
          headers: { 'x-user-role': 'super_admin' },
        }),
        fetch('/api/users'),
      ]);

      if (stRes.ok) setStations(await stRes.json());
      if (anRes.ok) setAnalytics(await anRes.json());
      if (emRes.ok) setEmails(await emRes.json());
      if (usrRes.ok) setUsersList(await usrRes.json());
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  const handleApproveStation = async (stationId: number) => {
    try {
      const res = await fetch(`/api/stations/${stationId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'approved' }),
      });
      if (res.ok) {
        setActionMessage({ type: 'success', text: 'Gas station approved and activated successfully!' });
        fetchAllData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleRejectStation = async () => {
    if (!rejectingStation) return;
    try {
      const res = await fetch(`/api/stations/${rejectingStation.id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'rejected',
          rejectionReason,
        }),
      });
      if (res.ok) {
        setActionMessage({ type: 'success', text: `Station "${rejectingStation.businessName}" application rejected.` });
        setRejectingStation(null);
        fetchAllData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Super Admin Permanently Deletes a Station
  const handleDeleteStation = async (station: GasStation) => {
    if (!window.confirm(`Permanently delete gas station "${station.businessName}" (Code: ${station.stationCode}) and all associated products & inventory records? This action is irreversible.`)) {
      return;
    }

    try {
      const res = await fetch(`/api/stations/${station.id}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (res.ok) {
        setActionMessage({ type: 'success', text: `✅ Station "${station.businessName}" and all related products were permanently deleted from the database.` });
        fetchAllData();
      } else {
        setActionMessage({ type: 'error', text: data.error || 'Failed to delete station' });
      }
    } catch (e: any) {
      setActionMessage({ type: 'error', text: e.message || 'Error occurred during deletion' });
    }
  };

  // Super Admin Permanently Deletes a User Account
  const handleDeleteUser = async (user: User) => {
    if (user.role === 'super_admin' || user.id === currentUser?.id) {
      setActionMessage({ type: 'error', text: 'Cannot delete the Super Admin account.' });
      return;
    }

    if (!window.confirm(`Permanently delete user account "${user.fullName || user.email}" (${user.role}) and all associated data? This action is irreversible.`)) {
      return;
    }

    try {
      const res = await fetch(`/api/users/${user.id}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (res.ok) {
        setActionMessage({ type: 'success', text: `✅ User account "${user.email}" was permanently deleted.` });
        fetchAllData();
      } else {
        setActionMessage({ type: 'error', text: data.error || 'Failed to delete user' });
      }
    } catch (e: any) {
      setActionMessage({ type: 'error', text: e.message || 'Error deleting user' });
    }
  };

  const pendingStations = stations.filter((s) => s.status === 'pending_approval');
  const approvedStations = stations.filter((s) => s.status === 'approved');

  const filteredStations = stations.filter(
    (s) =>
      s.businessName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.stationCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.city.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Super Admin Top Header */}
      <div className="bg-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6 border border-slate-800">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 text-xs font-semibold">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Super Admin Central Authority Control</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
            GasPoint Platform Governance Console
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 max-w-xl">
            Logged in as {currentUser?.fullName || 'Super Administrator'}. Verify gas point owners, manage compliance, inspect daily sales trends, and delete mini-admins or user accounts.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchAllData}
            className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-white flex items-center gap-1.5 transition-colors"
          >
            <RefreshCw className="w-4 h-4 text-emerald-400" />
            <span>Refresh System Data</span>
          </button>
        </div>
      </div>

      {/* Action Notification Banner */}
      {actionMessage && (
        <div
          className={`p-4 rounded-2xl flex items-center justify-between text-xs font-semibold shadow-xs ${
            actionMessage.type === 'success'
              ? 'bg-emerald-50 text-emerald-900 border border-emerald-200'
              : 'bg-red-50 text-red-900 border border-red-200'
          }`}
        >
          <div className="flex items-center gap-2">
            {actionMessage.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
            )}
            <span>{actionMessage.text}</span>
          </div>
          <button
            onClick={() => setActionMessage(null)}
            className="p-1 rounded-lg text-slate-500 hover:text-slate-800"
          >
            ✕
          </button>
        </div>
      )}

      {/* Primary Navigation Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 pb-3">
        <button
          onClick={() => setActiveTab('approvals')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
            activeTab === 'approvals'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>Pending Approvals</span>
          {pendingStations.length > 0 && (
            <span className="px-2 py-0.5 rounded-full bg-amber-400 text-slate-950 font-black text-[10px]">
              {pendingStations.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('stations')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
            activeTab === 'stations'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
          }`}
        >
          <Building2 className="w-4 h-4" />
          <span>All Gas Point Stations ({stations.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('users')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
            activeTab === 'users'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Users & Accounts ({usersList.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('analytics')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
            activeTab === 'analytics'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
          }`}
        >
          <TrendingUp className="w-4 h-4" />
          <span>Platform Revenue & Sales Trends</span>
        </button>

        <button
          onClick={() => setActiveTab('emails')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
            activeTab === 'emails'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
          }`}
        >
          <Mail className="w-4 h-4" />
          <span>Automated Email Logs ({emails.length})</span>
        </button>
      </div>

      {/* TAB 1: PENDING APPROVALS QUEUE */}
      {activeTab === 'approvals' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                Gas Point Owner Verification Requests
              </h2>
              <p className="text-xs text-slate-500">
                Super Admin can inspect licenses, approve, reject, or permanently delete applications
              </p>
            </div>
          </div>

          {pendingStations.length === 0 ? (
            <div className="p-12 text-center bg-white rounded-3xl border border-slate-200 text-slate-500 space-y-2">
              <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto" />
              <h4 className="font-bold text-slate-800 text-base">All Applications Verified</h4>
              <p className="text-xs text-slate-500">
                There are no pending gas station registration requests waiting for review.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {pendingStations.map((st) => (
                <div
                  key={st.id}
                  className="bg-white rounded-2xl border-2 border-amber-200 p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-xs bg-amber-100 text-amber-900 px-2.5 py-0.5 rounded-md">
                        {st.stationCode}
                      </span>
                      <span className="text-[11px] font-bold text-amber-700 uppercase tracking-wider bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                        Pending Verification
                      </span>
                      <span className="text-xs text-slate-400">
                        Submitted: {new Date(st.createdAt).toLocaleDateString()}
                      </span>
                    </div>

                    <h3 className="text-lg font-extrabold text-slate-900">
                      {st.businessName}
                    </h3>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs text-slate-600">
                      <div>
                        Owner: <strong className="text-slate-800">{st.ownerName || st.email}</strong>
                      </div>
                      <div>
                        License / EPRA:{' '}
                        <strong className="font-mono text-emerald-800">{st.licenseNumber || 'PENDING'}</strong>
                      </div>
                      <div>
                        Location: <strong className="text-slate-800">{st.address}, {st.city}</strong>
                      </div>
                      <div>
                        Phone: <strong className="text-slate-800">{st.phone}</strong>
                      </div>
                      <div>
                        Operating: <strong className="text-slate-800">{st.operatingHours}</strong>
                      </div>
                      <div>
                        Delivery Radius: <strong className="text-slate-800">{st.deliveryRadiusKm} km</strong>
                      </div>
                    </div>

                    {/* Activation Fee Verification Status (KSh 3,000 on 0706184411) */}
                    <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 flex flex-wrap items-center gap-2 text-xs">
                      <span className="font-bold text-slate-700">KSh 3,000 Activation Fee (to 0706184411):</span>
                      {st.activationPaymentRef ? (
                        <span className="inline-flex items-center gap-1 font-mono font-bold text-emerald-800 bg-emerald-100 px-2.5 py-0.5 rounded-md border border-emerald-300">
                          <Check className="w-3.5 h-3.5" />
                          <span>M-Pesa Ref: {st.activationPaymentRef}</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 font-bold text-amber-800 bg-amber-100 px-2.5 py-0.5 rounded-md border border-amber-300">
                          <Clock className="w-3.5 h-3.5" />
                          <span>Awaiting Payment Reference on 0706184411</span>
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Approve / Reject / Delete Actions */}
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => handleDeleteStation(st)}
                      title="Permanently Delete Application"
                      className="px-3.5 py-2 rounded-xl border border-red-200 text-red-600 hover:bg-red-50 text-xs font-bold flex items-center gap-1.5 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                      <span>Delete</span>
                    </button>
                    <button
                      onClick={() => setRejectingStation(st)}
                      className="px-3.5 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-bold flex items-center gap-1.5 transition-colors"
                    >
                      <X className="w-4 h-4" />
                      <span>Reject</span>
                    </button>
                    <button
                      onClick={() => handleApproveStation(st.id)}
                      className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-emerald-700/20 transition-all hover:scale-[1.02]"
                    >
                      <Check className="w-4 h-4" />
                      <span>Approve & Activate</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: ALL GAS STATIONS MANAGEMENT & DELETION */}
      {activeTab === 'stations' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Gas Point Owners Directory</h2>
              <p className="text-xs text-slate-500">
                Super Admin can inspect licenses, pause operations, or permanently delete gas point owners
              </p>
            </div>

            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search station or city..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-600 bg-white"
              />
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 font-bold uppercase tracking-wider border-b border-slate-200">
                  <tr>
                    <th className="py-3.5 px-4">Station Details</th>
                    <th className="py-3.5 px-4">Code / License</th>
                    <th className="py-3.5 px-4">Location</th>
                    <th className="py-3.5 px-4">Contact</th>
                    <th className="py-3.5 px-4">Status</th>
                    <th className="py-3.5 px-4 text-right">Delete / Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredStations.map((st) => (
                    <tr key={st.id} className="hover:bg-slate-50/50">
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900 text-sm">{st.businessName}</div>
                        <div className="text-[11px] text-slate-400">Owner: {st.ownerName || st.email}</div>
                      </td>
                      <td className="py-3.5 px-4 font-mono">
                        <div className="font-bold text-emerald-800">{st.stationCode}</div>
                        <div className="text-[10px] text-slate-500">{st.licenseNumber || 'N/A'}</div>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-slate-700">{st.city}</div>
                        <div className="text-[10px] text-slate-400">{st.address}</div>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="text-slate-800 font-medium">{st.phone}</div>
                        <div className="text-[10px] text-slate-400">{st.email}</div>
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`font-bold px-2.5 py-1 rounded-full text-[10px] uppercase ${
                            st.status === 'approved'
                              ? 'bg-emerald-100 text-emerald-800'
                              : st.status === 'pending_approval'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {st.status.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {st.status === 'pending_approval' && (
                            <button
                              onClick={() => handleApproveStation(st.id)}
                              className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px]"
                            >
                              Approve
                            </button>
                          )}
                          <button
                            onClick={() => handleDeleteStation(st)}
                            title="Delete Mini Admin Gas Point Station"
                            className="px-2.5 py-1 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 transition-colors font-bold flex items-center gap-1 text-[11px]"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Delete Station</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: USERS & ACCOUNTS DIRECTORY */}
      {activeTab === 'users' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Registered Users & Roles</h2>
              <p className="text-xs text-slate-500">
                Manage registered customer and gas provider accounts in PostgreSQL database
              </p>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 font-bold uppercase tracking-wider border-b border-slate-200">
                  <tr>
                    <th className="py-3.5 px-4">User</th>
                    <th className="py-3.5 px-4">Email</th>
                    <th className="py-3.5 px-4">Phone</th>
                    <th className="py-3.5 px-4">Role</th>
                    <th className="py-3.5 px-4">Registered Date</th>
                    <th className="py-3.5 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {usersList.map((usr) => {
                    const isSuper = usr.role === 'super_admin' || usr.id === currentUser?.id;
                    return (
                      <tr key={usr.id} className="hover:bg-slate-50/50">
                        <td className="py-3.5 px-4 font-bold text-slate-900">
                          {usr.fullName || 'No Name'}
                        </td>
                        <td className="py-3.5 px-4 text-slate-700">{usr.email}</td>
                        <td className="py-3.5 px-4 text-slate-600">{usr.phone || 'N/A'}</td>
                        <td className="py-3.5 px-4">
                          <span
                            className={`font-bold px-2 py-0.5 rounded-full text-[10px] uppercase ${
                              isSuper
                                ? 'bg-amber-400 text-slate-950'
                                : usr.role === 'gas_owner'
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-slate-100 text-slate-700'
                            }`}
                          >
                            {usr.role.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-slate-400">
                          {new Date(usr.createdAt).toLocaleDateString()}
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          {isSuper ? (
                            <span className="text-[10px] text-slate-400 font-semibold italic">Protected</span>
                          ) : (
                            <button
                              onClick={() => handleDeleteUser(usr)}
                              className="px-2.5 py-1 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 font-bold text-[11px] flex items-center gap-1 ml-auto transition-colors"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              <span>Delete User</span>
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: PLATFORM REVENUE & SALES TRENDS */}
      {activeTab === 'analytics' && analytics && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
              <div className="text-xs font-semibold text-slate-500">Total Platform Revenue</div>
              <div className="text-3xl font-black text-emerald-800 mt-1">
                KSh {analytics.totalPlatformRevenue.toLocaleString()}
              </div>
              <div className="text-[11px] text-emerald-600 mt-1">Verified nationwide sales</div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
              <div className="text-xs font-semibold text-slate-500">Total Orders Processed</div>
              <div className="text-3xl font-black text-slate-900 mt-1">
                {analytics.totalOrdersCount}
              </div>
              <div className="text-[11px] text-slate-500 mt-1">
                {analytics.completedOrdersCount} successfully delivered
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
              <div className="text-xs font-semibold text-slate-500">Active Gas Stations</div>
              <div className="text-3xl font-black text-emerald-700 mt-1">
                {analytics.approvedStationsCount} / {analytics.totalStationsCount}
              </div>
              <div className="text-[11px] text-slate-500 mt-1">Approved & serving customers</div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
              <div className="text-xs font-semibold text-slate-500">Pending Reviews</div>
              <div className="text-3xl font-black text-amber-600 mt-1">
                {analytics.pendingStationsCount}
              </div>
              <div className="text-[11px] text-slate-500 mt-1">Awaiting compliance signoff</div>
            </div>
          </div>

          {/* Daily Sales Trend Chart */}
          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-4">
            <h3 className="font-extrabold text-slate-900 text-base">
              Platform Daily Sales Trend (Past 7 Days)
            </h3>
            <div className="grid grid-cols-7 gap-2 pt-4">
              {analytics.dailySalesTrends.map((d: any, idx: number) => {
                const maxRev = Math.max(...analytics.dailySalesTrends.map((t: any) => t.revenue), 10000);
                const heightPercent = Math.max(15, Math.round((d.revenue / maxRev) * 100));

                return (
                  <div key={idx} className="flex flex-col items-center gap-2">
                    <span className="text-[10px] font-bold text-slate-700">
                      KSh {d.revenue > 0 ? (d.revenue / 1000).toFixed(1) + 'k' : '0'}
                    </span>
                    <div className="w-full bg-slate-100 rounded-xl h-40 flex items-end p-1.5">
                      <div
                        style={{ height: `${heightPercent}%` }}
                        className="w-full bg-gradient-to-t from-emerald-800 to-emerald-500 rounded-lg transition-all"
                      />
                    </div>
                    <span className="text-[10px] text-slate-600 font-bold">{d.date}</span>
                    <span className="text-[9px] text-slate-400">{d.orders} orders</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: AUTOMATED EMAIL LOGS */}
      {activeTab === 'emails' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                Automated Transactional Emails & Audit Trail
              </h2>
              <p className="text-xs text-slate-500">
                Live delivery status alerts, owner approval notices, and M-Pesa receipts sent by the system
              </p>
            </div>
          </div>

          <div className="space-y-3">
            {emails.map((em) => (
              <div
                key={em.id}
                className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs space-y-2 text-xs"
              >
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-emerald-600" />
                    <span className="font-bold text-slate-900">{em.subject}</span>
                    <span className="font-mono text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">
                      {em.templateType}
                    </span>
                  </div>
                  <span className="text-slate-400 text-[11px]">
                    {new Date(em.sentAt).toLocaleString()}
                  </span>
                </div>

                <div className="text-slate-600 leading-relaxed bg-slate-50 p-3 rounded-xl">
                  {em.content}
                </div>

                <div className="flex justify-between items-center text-[11px] text-slate-400">
                  <span>
                    Recipient: <strong className="text-slate-700">{em.recipientName}</strong> (
                    {em.recipientEmail})
                  </span>
                  <span className="text-emerald-700 font-bold flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Delivered
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* REJECTION MODAL */}
      {rejectingStation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white rounded-2xl p-6 shadow-2xl border border-slate-100 space-y-4">
            <h3 className="font-bold text-base text-slate-900">
              Reject Station Application: {rejectingStation.businessName}
            </h3>
            <p className="text-xs text-slate-500">
              An automated notification will be emailed to {rejectingStation.email} stating the reason for rejection.
            </p>

            <div>
              <label className="block text-xs font-semibold mb-1">Reason for Rejection</label>
              <textarea
                rows={3}
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                className="w-full text-xs p-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-red-500"
              />
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setRejectingStation(null)}
                className="flex-1 py-2 rounded-xl border border-slate-200 text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleRejectStation}
                className="flex-1 py-2 rounded-xl bg-red-600 text-white text-xs font-bold"
              >
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
