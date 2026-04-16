/**
 * AdminPanel
 *
 * Accessible only to users with the 'admin' role.
 * Shows all registered users and allows changing their roles.
 *
 * Role descriptions shown in the UI:
 *  - viewer  → read-only, cannot create/edit/delete
 *  - editor  → can create and edit releases
 *  - admin   → full access + can manage user roles
 */

import React, { useEffect, useState } from 'react';
import { X, Shield, User, ChevronDown, RefreshCw, AlertCircle } from 'lucide-react';
import { UserProfile, UserRole, subscribeToAllUsers, updateUserRole, subscribeToAccessRequests, resolveAccessRequest, AccessRequest } from '../services/firebaseUsers';
import { createNotification } from '../services/firebaseNotifications';

interface AdminPanelProps {
  isOpen: boolean;
  onClose: () => void;
  darkMode?: boolean;
  currentUserUid?: string;
  accessRequestCount?: number;
}

const ROLE_LABELS: Record<UserRole, { label: string; description: string; color: string; darkColor: string }> = {
  viewer: {
    label: 'Viewer',
    description: 'Read-only access',
    color: 'bg-gray-100 text-gray-700 border-gray-200',
    darkColor: 'bg-gray-700/50 text-gray-300 border-gray-600',
  },
  editor: {
    label: 'Editor',
    description: 'Can create & edit releases',
    color: 'bg-blue-100 text-blue-700 border-blue-200',
    darkColor: 'bg-blue-900/30 text-blue-300 border-blue-700',
  },
  admin: {
    label: 'Admin',
    description: 'Full access + manage users',
    color: 'bg-purple-100 text-purple-700 border-purple-200',
    darkColor: 'bg-purple-900/30 text-purple-300 border-purple-700',
  },
};

const RoleBadge: React.FC<{ role: UserRole; darkMode: boolean }> = ({ role, darkMode }) => {
  const meta = ROLE_LABELS[role];
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${
      darkMode ? meta.darkColor : meta.color
    }`}>
      {meta.label}
    </span>
  );
};

export const AdminPanel: React.FC<AdminPanelProps> = ({
  isOpen,
  onClose,
  darkMode = false,
  currentUserUid,
  accessRequestCount = 0,
}) => {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [requests, setRequests] = useState<AccessRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingUid, setUpdatingUid] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    setLoading(true);
    
    const unsubscribeUsers = subscribeToAllUsers(
      (liveUsers) => {
        setUsers(liveUsers);
        setLoading(false);
      },
      (err) => {
        console.error('AdminPanel: error loading users', err);
        setError('Failed to load users');
        setLoading(false);
      }
    );

    const unsubscribeRequests = subscribeToAccessRequests(
      (liveRequests) => {
        setRequests(liveRequests);
      },
      (err) => console.error('AdminPanel: error loading requests', err)
    );

    return () => {
      unsubscribeUsers();
      unsubscribeRequests();
    };
  }, [isOpen]);

  const handleRoleChange = async (user: UserProfile, newRole: UserRole) => {
    if (user.uid === currentUserUid) {
      setError("You cannot change your own role.");
      return;
    }
    setUpdatingUid(user.uid);
    setError(null);
    setSuccessMsg(null);
    try {
      await updateUserRole(user.uid, newRole);
      setSuccessMsg(`${user.displayName}'s role updated to ${ROLE_LABELS[newRole].label}`);
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err) {
      console.error('Failed to update role:', err);
      setError('Failed to update role. Please try again.');
    } finally {
      setUpdatingUid(null);
    }
  };

  const handleResolveRequest = async (request: AccessRequest, approved: boolean) => {
    try {
      if (approved) {
        await updateUserRole(request.uid, 'editor');
        await resolveAccessRequest(request.id, 'approved');
        await createNotification(request.uid, 'access_approved', 'Your access request has been approved. You now have Editor access.');
        setSuccessMsg(`Approved access for ${request.displayName}`);
      } else {
        await resolveAccessRequest(request.id, 'rejected');
        await createNotification(request.uid, 'access_rejected', 'Your access request has been rejected. Please contact admin for more information.');
        setSuccessMsg(`Rejected access for ${request.displayName}`);
      }
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err: any) {
      console.error('Failed to resolve request:', err);
      setError(err?.message || 'Failed to process request');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className={`rounded-xl shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col ${
        darkMode ? 'bg-gray-800' : 'bg-white'
      }`}>
        {/* Header */}
        <div className={`flex items-center justify-between p-5 border-b ${
          darkMode ? 'border-gray-700' : 'border-gray-200'
        }`}>
          <div className="flex items-center gap-2">
            <Shield className={`w-5 h-5 ${darkMode ? 'text-purple-400' : 'text-purple-600'}`} />
            <h2 className={`text-lg font-semibold ${darkMode ? 'text-gray-100' : 'text-gray-900'}`}>
              User Access Management
            </h2>
          </div>
          <button
            onClick={onClose}
            className={`p-1 rounded-lg transition-colors ${
              darkMode
                ? 'text-gray-400 hover:text-gray-200 hover:bg-gray-700'
                : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'
            }`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Role legend */}
        <div className={`px-5 py-3 border-b ${darkMode ? 'border-gray-700 bg-gray-900/30' : 'border-gray-100 bg-gray-50'}`}>
          <p className={`text-xs font-medium mb-2 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
            ROLE PERMISSIONS
          </p>
          <div className="flex flex-wrap gap-3">
            {(Object.entries(ROLE_LABELS) as [UserRole, typeof ROLE_LABELS[UserRole]][]).map(([role, meta]) => (
              <div key={role} className="flex items-center gap-1.5">
                <RoleBadge role={role} darkMode={darkMode} />
                <span className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  — {meta.description}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Messages */}
        {error && (
          <div className={`mx-5 mt-3 px-3 py-2 rounded-lg flex items-center gap-2 text-sm ${
            darkMode ? 'bg-red-900/20 text-red-400' : 'bg-red-50 text-red-600'
          }`}>
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            {error}
          </div>
        )}
        {successMsg && (
          <div className={`mx-5 mt-3 px-3 py-2 rounded-lg text-sm ${
            darkMode ? 'bg-green-900/20 text-green-400' : 'bg-green-50 text-green-700'
          }`}>
            ✓ {successMsg}
          </div>
        )}

        {/* Access Requests Section */}
        {requests.length > 0 && (
          <div className={`px-5 py-4 border-b ${darkMode ? 'border-gray-700 bg-blue-900/10' : 'border-gray-200 bg-blue-50/50'}`}>
            <h3 className={`text-xs font-bold uppercase mb-3 ${darkMode ? 'text-blue-400' : 'text-blue-700'}`}>
              Pending Access Requests ({requests.length})
            </h3>
            <div className="space-y-2">
              {requests.map((req) => (
                <div key={req.id} className={`flex items-center justify-between p-3 rounded-lg border ${
                  darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
                }`}>
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold bg-blue-500`}>
                      {req.displayName.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className={`text-sm font-medium ${darkMode ? 'text-gray-200' : 'text-gray-900'}`}>
                        {req.displayName}
                      </p>
                      <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                        {req.email}
                      </p>
                      {req.action && (
                        <p className={`text-xs mt-0.5 font-medium ${darkMode ? 'text-amber-300' : 'text-amber-700'}`}>
                          Requested: {req.action}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleResolveRequest(req, true)}
                      className="px-3 py-1.5 text-xs font-medium bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
                    >
                      Approve
                    </button>
                    <button
                      onClick={() => handleResolveRequest(req, false)}
                      className={`px-3 py-1.5 text-xs font-medium rounded border transition-colors ${
                        darkMode
                          ? 'border-gray-600 text-gray-300 hover:bg-gray-700'
                          : 'border-gray-300 text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      Reject
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* User list */}
        <div className="flex-1 overflow-y-auto p-5">
          {loading && (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className={`flex items-center justify-between p-3 rounded-lg border animate-pulse ${
                  darkMode ? 'bg-gray-700/50 border-gray-700' : 'bg-gray-50 border-gray-200'
                }`}>
                  <div className="flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-full ${darkMode ? 'bg-gray-600' : 'bg-gray-300'}`} />
                    <div className="space-y-1">
                      <div className={`h-3 w-28 rounded ${darkMode ? 'bg-gray-600' : 'bg-gray-300'}`} />
                      <div className={`h-3 w-40 rounded ${darkMode ? 'bg-gray-600' : 'bg-gray-300'}`} />
                    </div>
                  </div>
                  <div className={`h-8 w-28 rounded ${darkMode ? 'bg-gray-600' : 'bg-gray-300'}`} />
                </div>
              ))}
            </div>
          )}

          {!loading && users.length === 0 && (
            <div className="text-center py-8">
              <User className={`w-10 h-10 mx-auto mb-2 ${darkMode ? 'text-gray-600' : 'text-gray-400'}`} />
              <p className={`text-sm ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                No users found
              </p>
            </div>
          )}

          {!loading && users.map((user) => {
            const isCurrentUser = user.uid === currentUserUid;
            const isUpdating = updatingUid === user.uid;

            return (
              <div
                key={user.uid}
                className={`flex items-center justify-between p-3 rounded-lg border mb-2 ${
                  darkMode
                    ? 'bg-gray-700/30 border-gray-700'
                    : 'bg-gray-50 border-gray-200'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  {/* Avatar */}
                  <div className={`w-9 h-9 rounded-full flex-shrink-0 flex items-center justify-center text-white text-sm font-bold bg-indigo-500`}>
                    {user.displayName.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`text-sm font-medium ${darkMode ? 'text-gray-200' : 'text-gray-900'}`}>
                        {user.displayName}
                      </span>
                      {isCurrentUser && (
                        <span className={`text-xs px-1.5 py-0.5 rounded ${
                          darkMode ? 'bg-gray-700 text-gray-400' : 'bg-gray-200 text-gray-500'
                        }`}>
                          You
                        </span>
                      )}
                    </div>
                    <p className={`text-xs truncate ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                      {user.email}
                    </p>
                    {user.grantedBy && (
                      <p className={`text-xs ${darkMode ? 'text-gray-600' : 'text-gray-400'}`}>
                        Role set by {user.grantedBy}
                      </p>
                    )}
                  </div>
                </div>

                {/* Role selector */}
                <div className="flex items-center gap-2 flex-shrink-0 ml-3">
                  {isUpdating ? (
                    <RefreshCw className={`w-4 h-4 animate-spin ${darkMode ? 'text-gray-400' : 'text-gray-500'}`} />
                  ) : null}
                  <div className="relative">
                    <select
                      value={user.role}
                      onChange={(e) => handleRoleChange(user, e.target.value as UserRole)}
                      disabled={isCurrentUser || isUpdating}
                      className={`pl-3 pr-8 py-1.5 text-sm border rounded-lg appearance-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-colors ${
                        isCurrentUser
                          ? darkMode
                            ? 'bg-gray-700 border-gray-600 text-gray-500 cursor-not-allowed'
                            : 'bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed'
                          : darkMode
                            ? 'bg-gray-700 border-gray-600 text-gray-200 cursor-pointer hover:border-purple-500'
                            : 'bg-white border-gray-300 text-gray-900 cursor-pointer hover:border-purple-400'
                      }`}
                      style={{
                        backgroundImage: darkMode
                          ? 'url("data:image/svg+xml,%3csvg xmlns=\'http://www.w3.org/2000/svg\' fill=\'none\' viewBox=\'0 0 20 20\'%3e%3cpath stroke=\'%239ca3af\' stroke-linecap=\'round\' stroke-linejoin=\'round\' stroke-width=\'1.5\' d=\'M6 8l4 4 4-4\'/%3e%3c/svg%3e")'
                          : 'url("data:image/svg+xml,%3csvg xmlns=\'http://www.w3.org/2000/svg\' fill=\'none\' viewBox=\'0 0 20 20\'%3e%3cpath stroke=\'%236b7280\' stroke-linecap=\'round\' stroke-linejoin=\'round\' stroke-width=\'1.5\' d=\'M6 8l4 4 4-4\'/%3e%3c/svg%3e")',
                        backgroundPosition: 'right 0.5rem center',
                        backgroundRepeat: 'no-repeat',
                        backgroundSize: '1.5em 1.5em',
                      }}
                    >
                      <option value="viewer">Viewer</option>
                      <option value="editor">Editor</option>
                      <option value="admin">Admin</option>
                    </select>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer note */}
        <div className={`px-5 py-3 border-t text-xs ${
          darkMode ? 'border-gray-700 text-gray-500' : 'border-gray-200 text-gray-400'
        }`}>
          Changes take effect immediately. Users will see their new permissions on next action.
        </div>
      </div>
    </div>
  );
};
