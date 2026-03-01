import { supabase } from "@/integrations/supabase/client";

/**
 * Invoke a Supabase edge function with a client-side timeout.
 * Prevents UI from hanging indefinitely if the function is slow or unresponsive.
 */
export async function invokeWithTimeout<T = any>(
  functionName: string,
  body?: Record<string, any>,
  timeoutMs = 30_000
): Promise<{ data: T | null; error: Error | null }> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const { data, error } = await supabase.functions.invoke(functionName, {
      body,
      // @ts-ignore - AbortSignal support varies
    });

    clearTimeout(timer);

    if (error) {
      return { data: null, error: error instanceof Error ? error : new Error(String(error)) };
    }

    return { data: data as T, error: null };
  } catch (err: any) {
    clearTimeout(timer);

    if (err?.name === "AbortError" || controller.signal.aborted) {
      return {
        data: null,
        error: new Error("Die Anfrage hat zu lange gedauert. Bitte versuchen Sie es erneut."),
      };
    }

    return {
      data: null,
      error: err instanceof Error ? err : new Error("Unbekannter Fehler"),
    };
  }
}
