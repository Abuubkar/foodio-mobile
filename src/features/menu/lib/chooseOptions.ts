import type { ChosenOption } from '@/features/cart';

import type { MenuOptionChoice, MenuOptionGroup } from '../types/menu.types';

/** Which choices are ticked, by group. */
export type Selection = Readonly<Record<string, readonly string[]>>;

const chosenIn = (selection: Selection, groupId: string): readonly string[] =>
  selection[groupId] ?? [];

export const isChosen = (selection: Selection, groupId: string, choiceId: string): boolean =>
  chosenIn(selection, groupId).includes(choiceId);

const available = (choice: MenuOptionChoice): boolean => choice.isAvailable !== false;

/**
 * Ticking a choice, obeying the group's own arithmetic.
 *
 * A group that allows one answer swaps rather than refusing: tapping "Large"
 * when "Small" is ticked means you want Large, and making the customer untick
 * first is a pointless tap. A group that allows several fills up and then
 * ignores the next tap — silently, because the control is already visibly full.
 */
export function toggleChoice(
  selection: Selection,
  group: MenuOptionGroup,
  choiceId: string,
): Selection {
  const current = chosenIn(selection, group.id);

  if (current.includes(choiceId)) {
    return { ...selection, [group.id]: current.filter((id) => id !== choiceId) };
  }

  if (group.maxChoices === 1) return { ...selection, [group.id]: [choiceId] };
  if (current.length >= group.maxChoices) return selection;

  return { ...selection, [group.id]: [...current, choiceId] };
}

/**
 * The first group still missing an answer, or null when the dish is ready.
 *
 * Returned rather than a boolean so the screen can say *which* question is
 * unanswered. "Choose a size" is actionable; "something is missing" is not.
 */
export function firstUnanswered(
  groups: readonly MenuOptionGroup[],
  selection: Selection,
): MenuOptionGroup | null {
  return groups.find((group) => chosenIn(selection, group.id).length < group.minChoices) ?? null;
}

/**
 * The selection as Cart Lines record it: names and deltas copied, in the
 * menu's own order rather than the order they were tapped.
 *
 * A sold-out choice is dropped rather than carried. The server refuses one
 * anyway, and a stale menu is the likeliest way a customer holds one.
 */
export function chosenOptionsFrom(
  groups: readonly MenuOptionGroup[],
  selection: Selection,
): ChosenOption[] {
  return groups.flatMap((group) =>
    group.choices
      .filter((choice) => available(choice) && isChosen(selection, group.id, choice.id))
      .map((choice) => ({
        groupId: group.id,
        groupName: group.name,
        choiceId: choice.id,
        choiceName: choice.name,
        priceDeltaMinor: choice.priceDeltaMinor,
      })),
  );
}

/**
 * What one of these dishes costs as currently chosen.
 *
 * The same sum the server will do at placement. If they disagree the Order is
 * refused, which is the point — this one is for the button.
 */
export function unitPriceWith(priceMinor: number, options: readonly ChosenOption[]): number {
  return priceMinor + options.reduce((total, option) => total + option.priceDeltaMinor, 0);
}

/**
 * Whether the plain `+` on a menu row can add this dish at all.
 *
 * A dish with a question that must be answered cannot be added without one, so
 * the row has to open the dish page instead of adding silently.
 */
export const needsChoosing = (groups: readonly MenuOptionGroup[] | undefined): boolean =>
  (groups ?? []).some((group) => group.minChoices > 0);
