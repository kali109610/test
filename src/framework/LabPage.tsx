import { Suspense } from 'react';
import { Link, useParams } from 'react-router';
import { LAB_COMPONENTS } from '../labs/components';
import { getLab } from '../labs/registry';

/**
 * Route for /lab/:id. Built labs will render their LabShell here.
 * Unbuilt labs say so plainly — no fake interactivity.
 */
export function LabPage() {
  const { id = '' } = useParams();
  const lab = getLab(id);
  const Lab = LAB_COMPONENTS[id];

  if (lab?.status === 'ready' && Lab) {
    return (
      <Suspense fallback={<p className="p-6 text-sm text-muted">Loading the {lab.title.toLowerCase()} lab…</p>}>
        <Lab />
      </Suspense>
    );
  }

  return (
    <main className="flex min-h-full items-center justify-center p-6">
      <div className="w-full max-w-md rounded-2xl border border-line bg-white p-6 shadow-sm">
        {lab ? (
          <>
            <p className="text-xs font-medium tracking-wide text-muted uppercase">Lab {lab.order}</p>
            <h1 className="mt-1 text-2xl font-semibold">{lab.title}</h1>
            <p className="mt-2 text-muted">{lab.blurb}</p>
            <p className="mt-4 rounded-lg bg-paper px-3 py-2 text-sm">
              Not built yet. Nothing here is interactive until it's real.
            </p>
          </>
        ) : (
          <h1 className="text-xl font-semibold">There's no lab called “{id}”.</h1>
        )}
        <Link
          to="/"
          className="pressable mt-6 inline-block rounded-lg border border-line px-4 py-2 text-sm font-medium"
        >
          ← Back to the map
        </Link>
      </div>
    </main>
  );
}
