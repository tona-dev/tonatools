/**
 * The contract every use-case returns: either a value, or a reason it could not
 * produce one. Failure reasons stay machine-readable — the command layer owns
 * the wording, so use-cases never import `vscode` to show a message.
 */
export type UseCaseResult<TValue, TFailure extends string> =
  | { readonly ok: true; readonly value: TValue }
  | { readonly ok: false; readonly reason: TFailure };
