import React, { useState, useEffect } from 'react';
import {
  Cloud,
  Upload,
  RefreshCw,
  Trash2,
  ExternalLink,
  FileText,
  Image as ImageIcon,
  Folder,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Search,
  LogOut,
  HardDrive,
  FileCheck,
} from 'lucide-react';
import { User } from 'firebase/auth';
import { DriveFile, deleteDriveFile, getOrCreateClinicFolder, listClinicFiles, uploadToDrive } from '../utils/googleDriveService';
import { googleSignIn, logout, getAccessToken } from '../utils/firebaseAuth';
import { CLINIC_CONFIG, getStoredData } from '../utils/storage';
import { playClinicChime } from '../utils/sound';

interface GoogleDriveManagerProps {
  user: User | null;
  accessToken: string | null;
  onAuthSuccess: (user: User, token: string) => void;
  onLogout: () => void;
}

export const GoogleDriveManager: React.FC<GoogleDriveManagerProps> = ({
  user,
  accessToken,
  onAuthSuccess,
  onLogout,
}) => {
  const [files, setFiles] = useState<DriveFile[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [clinicFolderId, setClinicFolderId] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Destructive delete confirmation modal state
  const [fileToDelete, setFileToDelete] = useState<DriveFile | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Fetch files when user is connected
  useEffect(() => {
    if (user && accessToken) {
      loadFiles();
    }
  }, [user, accessToken]);

  const loadFiles = async () => {
    if (!accessToken) return;
    setLoading(true);
    setStatusMessage(null);

    try {
      const folderId = await getOrCreateClinicFolder(accessToken);
      setClinicFolderId(folderId);
      const list = await listClinicFiles(accessToken, folderId, searchQuery);
      setFiles(list);
    } catch (err: any) {
      console.error('Failed to load drive files:', err);
      setStatusMessage({ text: 'Google Drive से फाइलें लोड करने में समस्या: ' + (err.message || 'त्रुटि'), type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleSignIn = async () => {
    setLoading(true);
    setStatusMessage(null);
    try {
      const res = await googleSignIn();
      if (res) {
        onAuthSuccess(res.user, res.accessToken);
        playClinicChime('success');
      }
    } catch (err: any) {
      console.error('Login error:', err);
      setStatusMessage({ text: 'Google लॉगिन विफल: ' + (err.message || 'त्रुटि'), type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleBackupToDrive = async () => {
    if (!accessToken || !clinicFolderId) {
      setStatusMessage({ text: 'कृपया पहले Google Drive से कनेक्ट करें', type: 'error' });
      return;
    }

    setUploading(true);
    setStatusMessage(null);

    try {
      const backupData = {
        exportDate: new Date().toISOString(),
        clinic: CLINIC_CONFIG,
        requests: getStoredData('rc_requests', []),
        patients: getStoredData('rc_doc_patients', []),
        sales: getStoredData('rc_doc_sales', []),
        udhaari: getStoredData('rc_doc_udhaari', []),
      };

      const dateStr = new Date().toISOString().slice(0, 10);
      const filename = `Rita_Clinic_Backup_${dateStr}.json`;

      await uploadToDrive(
        accessToken,
        filename,
        'application/json',
        JSON.stringify(backupData, null, 2),
        clinicFolderId
      );

      playClinicChime('success');
      setStatusMessage({ text: `✅ क्लिनिक डेटा बैकअप सफलतापूर्वक Google Drive पर सेव हो गया! (${filename})`, type: 'success' });
      loadFiles();
    } catch (err: any) {
      console.error('Backup upload failed:', err);
      setStatusMessage({ text: 'बैकअप अपलोड विफल: ' + err.message, type: 'error' });
    } finally {
      setUploading(false);
    }
  };

  const handleCustomFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !accessToken || !clinicFolderId) return;

    setUploading(true);
    setStatusMessage(null);

    try {
      await uploadToDrive(accessToken, file.name, file.type || 'application/octet-stream', file, clinicFolderId);
      playClinicChime('success');
      setStatusMessage({ text: `✅ फाइल "${file.name}" Google Drive पर अपलोड हो गई!`, type: 'success' });
      loadFiles();
    } catch (err: any) {
      console.error('File upload failed:', err);
      setStatusMessage({ text: 'फाइल अपलोड विफल: ' + err.message, type: 'error' });
    } finally {
      setUploading(false);
      e.target.value = ''; // Reset input
    }
  };

  // Mandatory confirmation for destructive operations
  const confirmDelete = async () => {
    if (!fileToDelete || !accessToken) return;
    setIsDeleting(true);

    try {
      await deleteDriveFile(accessToken, fileToDelete.id);
      playClinicChime('notification');
      setStatusMessage({ text: `फाइल "${fileToDelete.name}" Google Drive से हटा दी गई।`, type: 'success' });
      setFileToDelete(null);
      loadFiles();
    } catch (err: any) {
      console.error('Delete failed:', err);
      setStatusMessage({ text: 'फाइल हटाने में त्रुटि: ' + err.message, type: 'error' });
    } finally {
      setIsDeleting(false);
    }
  };

  const formatFileSize = (bytes?: string) => {
    if (!bytes) return 'N/A';
    const num = parseInt(bytes, 10);
    if (isNaN(num)) return 'N/A';
    if (num < 1024) return num + ' B';
    if (num < 1024 * 1024) return (num / 1024).toFixed(1) + ' KB';
    return (num / (1024 * 1024)).toFixed(1) + ' MB';
  };

  return (
    <div className="bg-white rounded-2xl p-4 sm:p-6 border border-slate-200 shadow-sm space-y-5 text-xs">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b pb-4 border-slate-100">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600">
              <Cloud className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm sm:text-base text-slate-900 flex items-center gap-1.5">
                <span>Google Drive क्लाउड स्टोरेज</span>
                <span className="px-2 py-0.2 bg-emerald-100 text-emerald-800 text-[10px] font-bold rounded-full">
                  आधिकारिक एकीकरण
                </span>
              </h3>
              <p className="text-[11px] text-slate-500">
                मरीजों के पर्चे (Rx), दवा बिल, जांच रिपोर्ट व डेटा सुरक्षित Google Drive पर सिंक करें
              </p>
            </div>
          </div>
        </div>

        {/* User Connection Status / Sign In Button */}
        {user ? (
          <div className="flex items-center gap-2 bg-slate-50 p-1.5 rounded-xl border border-slate-200">
            {user.photoURL ? (
              <img src={user.photoURL} alt={user.displayName || 'Doctor'} className="w-7 h-7 rounded-full object-cover" />
            ) : (
              <div className="w-7 h-7 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center text-xs">
                {user.displayName?.charAt(0) || 'D'}
              </div>
            )}
            <div className="text-left pr-1">
              <p className="font-bold text-slate-900 leading-tight text-[11px]">{user.displayName || 'डॉ. रूपेश'}</p>
              <p className="text-[10px] text-slate-500 truncate max-w-[150px]">{user.email}</p>
            </div>
            <button
              onClick={async () => {
                await logout();
                onLogout();
              }}
              className="p-1 text-slate-400 hover:text-red-600 rounded-lg hover:bg-slate-200"
              title="Google खाता डिस्कनेक्ट करें"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <div>
            {/* Official Material Design "Sign in with Google" Button */}
            <button
              onClick={handleSignIn}
              disabled={loading}
              className="px-4 py-2 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs rounded-xl border border-slate-300 shadow-sm transition-all flex items-center gap-2"
            >
              <svg className="w-4 h-4" viewBox="0 0 48 48">
                <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
                <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
                <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
                <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
              </svg>
              <span>Google Drive से कनेक्ट करें</span>
            </button>
          </div>
        )}
      </div>

      {/* Status banner */}
      {statusMessage && (
        <div
          className={`p-3 rounded-xl flex items-center justify-between text-xs border ${
            statusMessage.type === 'success'
              ? 'bg-emerald-50 text-emerald-900 border-emerald-200'
              : 'bg-red-50 text-red-900 border-red-200'
          }`}
        >
          <div className="flex items-center gap-2">
            {statusMessage.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
            )}
            <span>{statusMessage.text}</span>
          </div>
          <button onClick={() => setStatusMessage(null)} className="font-bold text-slate-500 hover:text-slate-800">
            ✕
          </button>
        </div>
      )}

      {/* Main Drive Workspace (Only active when connected) */}
      {user ? (
        <div className="space-y-4">
          
          {/* Quick Action Cloud Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            
            {/* Card 1: 1-Click Clinic Backup */}
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-4 flex flex-col justify-between space-y-3">
              <div>
                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-blue-800 uppercase tracking-wider bg-blue-100 px-2 py-0.5 rounded-full mb-1">
                  <HardDrive className="w-3 h-3" />
                  <span>क्लाउड डेटा सिंक</span>
                </span>
                <h4 className="font-bold text-slate-900 text-sm">क्लिनिक बैकअप Google Drive पर अपलोड करें</h4>
                <p className="text-[11px] text-slate-600 mt-1">
                  मरीजों के पर्चे, बिलिंग रिकॉर्ड व उधारी खाता 1-क्लिक में Google Drive के "Rita_Clinic_Medical_Records" फोल्डर में सेव करें।
                </p>
              </div>

              <button
                onClick={handleBackupToDrive}
                disabled={uploading}
                className="w-full py-2.5 px-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg shadow-sm transition-all flex items-center justify-center gap-2"
              >
                {uploading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>अपलोड हो रहा है...</span>
                  </>
                ) : (
                  <>
                    <Cloud className="w-4 h-4" />
                    <span>1-क्लिक में Drive पर बैकअप सेव करें</span>
                  </>
                )}
              </button>
            </div>

            {/* Card 2: Upload Medical Report / Image / PDF */}
            <div className="bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-200 rounded-xl p-4 flex flex-col justify-between space-y-3">
              <div>
                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-800 uppercase tracking-wider bg-emerald-100 px-2 py-0.5 rounded-full mb-1">
                  <Upload className="w-3 h-3" />
                  <span>मरीज रिपोर्ट / फाइल</span>
                </span>
                <h4 className="font-bold text-slate-900 text-sm">जांच रिपोर्ट या पर्चा Drive में अपलोड करें</h4>
                <p className="text-[11px] text-slate-600 mt-1">
                  मरीज का ब्लड टेस्ट, अल्ट्रासाउंड, X-Ray या कोई भी मेडिकल दस्तावेज Google Drive में सुरक्षित रखें।
                </p>
              </div>

              <label className="w-full py-2.5 px-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer text-center">
                <Upload className="w-4 h-4" />
                <span>फाइल चुनें व Drive में अपलोड करें</span>
                <input
                  type="file"
                  onChange={handleCustomFileUpload}
                  className="hidden"
                  accept="image/*,application/pdf,.doc,.docx,.txt"
                />
              </label>
            </div>

          </div>

          {/* Drive Files Explorer */}
          <div className="border border-slate-200 rounded-xl overflow-hidden bg-slate-50">
            
            {/* Toolbar */}
            <div className="bg-white p-3 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Folder className="w-4 h-4 text-amber-500" />
                <span className="font-bold text-slate-800">
                  Rita_Clinic_Medical_Records ({files.length} फाइलें)
                </span>
              </div>

              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2" />
                  <input
                    type="text"
                    placeholder="फाइल नाम से खोजें..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && loadFiles()}
                    className="pl-7 pr-2 py-1 bg-slate-50 border border-slate-300 rounded-lg text-xs outline-none focus:bg-white"
                  />
                </div>

                <button
                  onClick={loadFiles}
                  disabled={loading}
                  className="p-1.5 text-slate-500 hover:text-slate-800 rounded-lg hover:bg-slate-100 border border-slate-200"
                  title="रिफ्रेश करें"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                </button>
              </div>
            </div>

            {/* Files List */}
            <div className="divide-y divide-slate-200 bg-white max-h-72 overflow-y-auto">
              {files.map((file) => (
                <div
                  key={file.id}
                  className="p-3 flex items-center justify-between gap-3 hover:bg-slate-50 transition-colors"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                      {file.mimeType.includes('pdf') || file.mimeType.includes('json') ? (
                        <FileText className="w-4 h-4" />
                      ) : file.mimeType.includes('image') ? (
                        <ImageIcon className="w-4 h-4 text-emerald-600" />
                      ) : (
                        <FileCheck className="w-4 h-4 text-indigo-600" />
                      )}
                    </div>

                    <div className="min-w-0">
                      <p className="font-semibold text-slate-900 truncate text-xs">{file.name}</p>
                      <p className="text-[10px] text-slate-500 flex items-center gap-2">
                        <span>साइज: {formatFileSize(file.size)}</span>
                        <span>•</span>
                        <span>अपडेट: {new Date(file.modifiedTime).toLocaleDateString('hi-IN')}</span>
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    {file.webViewLink && (
                      <a
                        href={file.webViewLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-semibold flex items-center gap-1 text-[11px]"
                      >
                        <ExternalLink className="w-3 h-3 text-blue-600" />
                        <span>देखें</span>
                      </a>
                    )}

                    <button
                      onClick={() => setFileToDelete(file)}
                      className="p-1 text-slate-400 hover:text-red-600 rounded-lg hover:bg-red-50"
                      title="Google Drive से हटाएं"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}

              {files.length === 0 && !loading && (
                <div className="text-center py-8 text-slate-400 text-xs">
                  Google Drive के क्लिनिक फोल्डर में अभी कोई फाइल नहीं है। ऊपर दिए गए बटन से बैकअप या मरीज रिपोर्ट अपलोड करें।
                </div>
              )}

              {loading && (
                <div className="text-center py-8 text-slate-500 text-xs flex items-center justify-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                  <span>Google Drive से फाइलें लोड हो रही हैं...</span>
                </div>
              )}
            </div>

          </div>

        </div>
      ) : (
        /* Not Connected State */
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 text-center space-y-3">
          <div className="w-12 h-12 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center mx-auto">
            <Cloud className="w-6 h-6" />
          </div>
          <h4 className="font-bold text-slate-900 text-sm">Google Drive क्लाउड बैकअप शुरू करें</h4>
          <p className="text-xs text-slate-600 max-w-md mx-auto leading-relaxed">
            रीता क्लिनिक के सभी रिकॉर्ड, पर्चे (Rx) और हिसाब को सुरक्षित रखने के लिए अपने Google Drive खाते से कनेक्ट करें। कंप्यूटर खराब होने या बदलने पर भी आपका सारा डेटा सुरक्षित रहेगा!
          </p>

          <button
            onClick={handleSignIn}
            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-md transition-all inline-flex items-center gap-2"
          >
            <Cloud className="w-4 h-4" />
            <span>Google Drive कनेक्ट करें (Connect Drive)</span>
          </button>
        </div>
      )}

      {/* MANDATORY EXPLICIT CONFIRMATION MODAL FOR DESTRUCTIVE ACTION (DELETION) */}
      {fileToDelete && (
        <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-3">
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full border border-slate-200 p-5 text-center space-y-3">
            <div className="w-10 h-10 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto">
              <Trash2 className="w-5 h-5" />
            </div>

            <h3 className="font-bold text-sm text-slate-900">फाइल हटाने की पुष्टि करें</h3>
            <p className="text-xs text-slate-600">
              क्या आप वाकई Google Drive से निम्नलिखित फाइल को हटाना चाहते हैं?
            </p>

            <div className="bg-slate-50 border border-slate-200 rounded-lg p-2.5 font-semibold text-slate-800 text-xs">
              📄 {fileToDelete.name}
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setFileToDelete(null)}
                className="flex-1 py-2 text-xs font-semibold border border-slate-300 rounded-xl hover:bg-slate-50"
              >
                रद्द करें (Cancel)
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={confirmDelete}
                className="flex-1 py-2 text-xs font-bold bg-red-600 hover:bg-red-700 text-white rounded-xl shadow flex items-center justify-center gap-1.5"
              >
                {isDeleting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                <span>हटाएं (Confirm Delete)</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
