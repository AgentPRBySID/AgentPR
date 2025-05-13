export const classifyRiskLevel = (text: string): string => {
    const lower = text.toLowerCase();
  
    if (
      lower.includes('fix') || lower.includes('bug') || lower.includes('hotfix') ||
      lower.includes('crash') || lower.includes('error') || lower.includes('urgent')
    ) return 'high-risk';
  
    if (
      lower.includes('docs') || lower.includes('readme') || lower.includes('changelog') ||
      lower.includes('typo') || lower.includes('comment') || lower.includes('format')
    ) return 'low-risk';
  
    if (
      lower.includes('feat') || lower.includes('add') || lower.includes('implement') ||
      lower.includes('feature') || lower.includes('enhancement') || lower.includes('update')
    ) return 'medium-risk';
  
    return 'medium-risk';
  };
  