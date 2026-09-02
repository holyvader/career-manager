import { Suspense } from 'react';
import { SessionGate } from '../SessionGate';

export default function Page() {
  return (
    <Suspense fallback={<span className="d-loading d-loading-spinner" />}>
      <SessionGate>
        <div>Settings</div>
      </SessionGate>
    </Suspense>
  );
}
