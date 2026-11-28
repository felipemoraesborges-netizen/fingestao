import { useCallback, useEffect, useRef, useState } from 'react';
import { sendPlayAction } from '../services/learningService';
import type { PlayAction, PlayState } from '../learning/playContracts';

export function usePlay(userId: string | undefined) {
  const [record, setRecord] = useState<{ userId: string; state: PlayState }>();
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const request = useRef<AbortController>(undefined);
  const working = useRef(false);
  const state = record?.userId === userId ? record?.state : undefined;
  const reload = useCallback(() => {
    if (!userId || working.current) return;
    request.current?.abort();
    const controller = new AbortController();
    request.current = controller;
    void sendPlayAction({ type: 'state' }, controller.signal).then(data => {
      if (!controller.signal.aborted) { setRecord({ userId, state: data }); setError(''); }
    }, (reason: unknown) => {
      if (!controller.signal.aborted) setError(reason instanceof Error ? reason.message : 'Não foi possível abrir o FinGestão Play.');
    });
  }, [userId]);

  useEffect(() => {
    reload();
    return () => request.current?.abort();
  }, [reload]);

  async function run(command: PlayAction) {
    if (working.current || !userId) return false;
    request.current?.abort();
    working.current = true;
    setBusy(true);
    setError('');
    try {
      setRecord({ userId, state: await sendPlayAction(command) });
      return true;
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Não foi possível salvar esta ação.');
      return false;
    } finally {
      working.current = false;
      setBusy(false);
    }
  }

  return { state, error, busy, reload, run };
}
