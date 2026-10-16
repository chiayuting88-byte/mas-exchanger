import React, { useState } from 'react';
import {
  GitBranch,
  X,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  Terminal,
  ExternalLink,
  ShieldCheck,
  RefreshCw,
} from 'lucide-react';
import {
  validateGitHubToken,
  testGitHubAuth,
  generatePushCommands,
} from '../services/gitSyncService';

interface GitSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const GitSyncModal: React.FC<GitSyncModalProps> = ({ isOpen, onClose }) => {
  const [tokenInput, setTokenInput] = useState<string>('ghp_3bbXNfvKRDorgZsAwmWGAfj378HsFo2H1m9');
  const [repoName] = useState<string>('chiayuting88-byte/mas-exchanger');
  const [testing, setTesting] = useState<boolean>(false);
  const [testResult, setTestResult] = useState<{
    tested: boolean;
    success: boolean;
    username?: string;
    error?: string;
  }>({
    tested: true,
    success: false,
    error: '401 Bad Credentials: The provided token has 39 characters, but GitHub classic PATs are exactly 40 characters (missing 1 character).',
  });
  const [copiedCmd, setCopiedCmd] = useState<boolean>(false);

  if (!isOpen) return null;

  const validation = validateGitHubToken(tokenInput);
  const commands = generatePushCommands(tokenInput, repoName);

  const handleTestToken = async () => {
    setTesting(true);
    try {
      const res = await testGitHubAuth(tokenInput);
      setTestResult({
        tested: true,
        success: res.success,
        username: res.username,
        error: res.error,
      });
    } finally {
      setTesting(false);
    }
  };

  const handleCopyCommands = () => {
    navigator.clipboard.writeText(commands.join('\n'));
    setCopiedCmd(true);
    setTimeout(() => setCopiedCmd(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
              <GitBranch className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">GitHub Repository Sync</h3>
              <div className="text-xs text-slate-400 flex items-center gap-1.5 mt-0.5">
                <span>Repository:</span>
                <a
                  href={`https://github.com/${repoName}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-emerald-400 hover:underline flex items-center gap-1 font-mono"
                >
                  {repoName}
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-6 text-sm">
          {/* Status Alert */}
          <div
            className={`p-4 rounded-2xl border ${
              testResult.success
                ? 'bg-emerald-950/20 border-emerald-500/30 text-emerald-200'
                : 'bg-amber-950/30 border-amber-500/30 text-amber-200'
            }`}
          >
            <div className="flex items-start gap-3">
              {testResult.success ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
              )}
              <div className="space-y-1">
                <div className="font-semibold text-sm">
                  {testResult.success
                    ? `Authenticated successfully as @${testResult.username}`
                    : 'Personal Access Token Authentication Failed'}
                </div>
                <div className="text-xs text-slate-300 leading-relaxed">
                  {testResult.error ||
                    'Token is valid with repository access. Codebase is ready to push.'}
                </div>
              </div>
            </div>
          </div>

          {/* Token Input & Format Inspection */}
          <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-white flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                GitHub Personal Access Token (PAT)
              </label>
              <span
                className={`text-xs font-mono tabular-nums ${
                  validation.isValidFormat ? 'text-emerald-400' : 'text-amber-400'
                }`}
              >
                {validation.charCount} / {validation.expectedCount} chars
              </span>
            </div>

            <div className="flex gap-2">
              <input
                type="text"
                value={tokenInput}
                onChange={(e) => {
                  setTokenInput(e.target.value);
                  setTestResult({ tested: false, success: false });
                }}
                placeholder="ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-xs font-mono text-white focus:outline-none focus:border-emerald-500"
              />
              <button
                onClick={handleTestToken}
                disabled={testing || !tokenInput.trim()}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-white text-xs font-semibold rounded-xl transition-colors flex items-center gap-1.5 shrink-0"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${testing ? 'animate-spin' : ''}`} />
                <span>Verify</span>
              </button>
            </div>

            <p className="text-[11px] text-slate-400 leading-normal">
              {validation.message}
            </p>
          </div>

          {/* Push Commands to run locally or in shell */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
                <Terminal className="w-4 h-4 text-emerald-400" />
                Direct Push Commands (One-Click Copy)
              </span>
              <button
                onClick={handleCopyCommands}
                className="flex items-center gap-1 text-xs text-emerald-400 hover:text-emerald-300 font-medium transition-colors"
              >
                {copiedCmd ? (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy All</span>
                  </>
                )}
              </button>
            </div>

            <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 font-mono text-xs text-slate-300 overflow-x-auto">
              {commands.map((cmd, idx) => (
                <div key={idx} className="py-0.5 whitespace-pre">
                  <span className="text-slate-500 select-none">$ </span>
                  <span className={cmd.includes('push') ? 'text-emerald-300' : 'text-slate-300'}>
                    {cmd}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* How to generate a new 40-character PAT */}
          <div className="p-4 rounded-2xl bg-slate-950/40 border border-slate-800 text-xs text-slate-400 space-y-2">
            <div className="font-semibold text-white">Need a new GitHub Token?</div>
            <ol className="list-decimal list-inside space-y-1 text-slate-300">
              <li>
                Open{' '}
                <a
                  href="https://github.com/settings/tokens/new"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-emerald-400 hover:underline inline-flex items-center gap-0.5"
                >
                  GitHub Personal Access Tokens
                  <ExternalLink className="w-3 h-3" />
                </a>
              </li>
              <li>Give it a note like &ldquo;MAS Exchanger&rdquo;</li>
              <li>Check the <strong className="text-white">repo</strong> scope (Full control of private and public repositories)</li>
              <li>Click &ldquo;Generate token&rdquo; and copy the complete 40-character string starting with <code className="text-emerald-300 font-mono">ghp_</code>.</li>
            </ol>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 sm:p-5 border-t border-slate-800 bg-slate-950/50 flex items-center justify-between">
          <div className="text-xs text-slate-400">
            Repository: <span className="font-mono text-white">main</span> branch
          </div>

          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold rounded-xl transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
