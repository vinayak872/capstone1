import React from 'react';

export default function VersionBadge({ version = 'v1.0.0', isCanary = false, isRollback = false }) {
  let badgeClass = 'badge-blue';
  if (isRollback) badgeClass = 'badge-red';
  else if (isCanary) badgeClass = 'badge-yellow';
  else if (version.startsWith('v1') || version.startsWith('v2')) badgeClass = 'badge-green';

  return (
    <span className={`badge ${badgeClass}`}>
      {version.startsWith('v') ? version : `v${version}`}
    </span>
  );
}
