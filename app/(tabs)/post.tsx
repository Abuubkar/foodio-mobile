/**
 * A slot in the tab bar, not a screen.
 *
 * The centre button renders itself and pushes `/post-clip`, so this is never
 * navigated to. It exists only because a tab needs a route file, and renders
 * nothing rather than redirecting — a redirect here runs inside the navigator
 * that owns the tab, which is a fight nobody needs to have.
 */
export default function PostTabSlot() {
  return null;
}
