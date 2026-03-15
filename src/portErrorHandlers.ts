// ---- ポートエラー・再生エラーハンドラのファクトリ ----

const LOG_PREFIX = '[BTA:portErrorHandlers]';

export interface PortErrorHandlersDeps {
  textarea: HTMLTextAreaElement;
  voicevoxDownloadRow: HTMLElement;
  surgextDownloadRow: HTMLElement;
  showTemplateSelectIfNeeded: () => void;
  showWavExportBtnIfNeeded: () => void;
  showErrorToast: (message: string) => void;
  setTextareaInitialized: (v: boolean) => void;
}

export interface PortErrorHandlers {
  handleError: (logLabel: string, message: string, error: unknown) => void;
  handleVoicevoxError: (logLabel: string, message: string, error: unknown) => void;
  handleSurgextError: (logLabel: string, message: string, error: unknown) => void;
  handleMixError: (logLabel: string, message: string, error: unknown) => void;
  clearPortErrorRows: () => void;
}

export function createPortErrorHandlers(deps: PortErrorHandlersDeps): PortErrorHandlers {
  const {
    textarea, voicevoxDownloadRow, surgextDownloadRow,
    showTemplateSelectIfNeeded, showWavExportBtnIfNeeded,
    showErrorToast, setTextareaInitialized,
  } = deps;

  function isPortError(err: unknown): boolean {
    if (!(err instanceof Error)) return false;
    const msg = err.message;
    return msg.includes('Failed to fetch') || msg.includes('ERR_CONNECTION_REFUSED') || msg.includes('ECONNREFUSED');
  }

  function clearPortErrorRows(): void {
    voicevoxDownloadRow.style.display = 'none';
    surgextDownloadRow.style.display = 'none';
  }

  function handleError(logLabel: string, message: string, error: unknown): void {
    console.error(LOG_PREFIX, logLabel, error);
    setTextareaInitialized(true);
    textarea.style.display = 'block';
    showTemplateSelectIfNeeded();
    showWavExportBtnIfNeeded();
    showErrorToast(message);
  }

  function handleVoicevoxError(logLabel: string, message: string, error: unknown): void {
    handleError(logLabel, message, error);
    if (isPortError(error)) {
      voicevoxDownloadRow.style.display = 'block';
    }
  }

  function handleSurgextError(logLabel: string, message: string, error: unknown): void {
    handleError(logLabel, message, error);
    if (isPortError(error)) {
      surgextDownloadRow.style.display = 'block';
    }
  }

  function isSurgeXtPortError(err: unknown): boolean {
    if (!(err instanceof Error)) return false;
    return err.message.startsWith('Surge XT:') && isPortError(err);
  }

  function handleMixError(logLabel: string, message: string, error: unknown): void {
    handleError(logLabel, message, error);
    if (isSurgeXtPortError(error)) {
      surgextDownloadRow.style.display = 'block';
    } else if (isPortError(error)) {
      voicevoxDownloadRow.style.display = 'block';
    }
  }

  return { handleError, handleVoicevoxError, handleSurgextError, handleMixError, clearPortErrorRows };
}
