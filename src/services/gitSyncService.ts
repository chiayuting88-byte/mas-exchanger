export interface GitTokenValidation {
  isValidFormat: boolean;
  tokenType: 'classic' | 'fine-grained' | 'unknown';
  charCount: number;
  expectedCount: number;
  message: string;
}

export function validateGitHubToken(token: string): GitTokenValidation {
  const clean = token.trim();

  if (!clean) {
    return {
      isValidFormat: false,
      tokenType: 'unknown',
      charCount: 0,
      expectedCount: 40,
      message: 'Token is empty. Please enter a personal access token.',
    };
  }

  if (clean.startsWith('ghp_')) {
    const len = clean.length;
    const isValid = len === 40;
    return {
      isValidFormat: isValid,
      tokenType: 'classic',
      charCount: len,
      expectedCount: 40,
      message: isValid
        ? 'Classic Personal Access Token format valid (40 characters).'
        : `Classic PAT has ${len} characters, but GitHub requires exactly 40 characters (missing ${40 - len} characters).`,
    };
  }

  if (clean.startsWith('github_pat_')) {
    const len = clean.length;
    const isValid = len >= 80;
    return {
      isValidFormat: isValid,
      tokenType: 'fine-grained',
      charCount: len,
      expectedCount: 93,
      message: isValid
        ? 'Fine-grained Personal Access Token format valid.'
        : `Fine-grained PAT appears too short (${len} characters).`,
    };
  }

  return {
    isValidFormat: false,
    tokenType: 'unknown',
    charCount: clean.length,
    expectedCount: 40,
    message: 'Token should start with "ghp_" (classic) or "github_pat_" (fine-grained).',
  };
}

export async function testGitHubAuth(token: string): Promise<{
  success: boolean;
  username?: string;
  error?: string;
  scopes?: string[];
}> {
  try {
    const res = await fetch('https://api.github.com/user', {
      headers: {
        Authorization: `token ${token.trim()}`,
        Accept: 'application/vnd.github.v3+json',
      },
    });

    if (res.status === 401) {
      return {
        success: false,
        error: 'Bad credentials (401). The token may be truncated, invalid, or expired on GitHub.',
      };
    }

    if (!res.ok) {
      return {
        success: false,
        error: `GitHub API error: HTTP ${res.status}`,
      };
    }

    const data = await res.json();
    const scopesHeader = res.headers.get('x-oauth-scopes');
    const scopes = scopesHeader ? scopesHeader.split(',').map((s) => s.trim()) : [];

    return {
      success: true,
      username: data.login,
      scopes,
    };
  } catch (err: any) {
    return {
      success: false,
      error: err?.message || 'Could not reach GitHub API (network check).',
    };
  }
}

export function generatePushCommands(token: string, repo: string = 'chiayuting88-byte/mas-exchanger'): string[] {
  const cleanToken = token.trim();
  const repoUrl = cleanToken
    ? `https://${cleanToken}@github.com/${repo}.git`
    : `https://github.com/${repo}.git`;

  return [
    `git init`,
    `git branch -M main`,
    `git remote add origin ${repoUrl} 2>/dev/null || git remote set-url origin ${repoUrl}`,
    `git add .`,
    `git commit -m "Build MAS Exchanger complete suite"`,
    `git push -u origin main --force`,
  ];
}
