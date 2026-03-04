import { memo, useCallback, useMemo, useState, useTransition } from "react";
import { Link } from "@tanstack/react-router";
import {
	EMPTY_STATS,
	STAT_CAP,
	STAT_LIST_LABELS,
	STAT_ROWS,
	TYPE_DEFENSE_ROWS,
} from "./constants";
import { PokemonSprite } from "./PokemonSprite";
import type {
	DefenseMultiplierMap,
	EvolutionLink,
	PokemonRecord,
	StatKey,
} from "./types";
import {
	describeEvolutionRequirement,
	formatPokemonId,
	formatMultiplier,
	getDefenseMultiplierTone,
	getDefensiveMatchupLabel,
	getStatBarGradient,
	getTypeColor,
	toDisplayLabel,
} from "./utils";

type SearchCardProps = {
	actionLabel: string;
	actionTo: "/" | "/pokemon";
	inputId: string;
	onQueryChange: (value: string) => void;
	query: string;
	quickMatches?: PokemonRecord[];
	onQuickSelect?: (key: string) => void;
};

export function PokedexSearchCard({
	actionLabel,
	actionTo,
	inputId,
	onQueryChange,
	query,
	quickMatches,
	onQuickSelect,
}: SearchCardProps) {
	return (
		<section className="island-shell rise-in rounded-2xl px-4 py-4 sm:px-5">
			<div className="flex flex-col gap-3 lg:flex-row lg:items-center">
				<div className="min-w-0 flex-1">
					<label
						htmlFor={inputId}
						className="mb-2 block text-xs font-bold tracking-[0.14em] text-[var(--kicker)] uppercase"
					>
						Search Pokemon
					</label>
					<input
						id={inputId}
						value={query}
						onChange={(event) => onQueryChange(event.target.value)}
						placeholder="Search by Pokemon name..."
						className="w-full rounded-xl border border-[var(--line)] bg-[color-mix(in_oklab,var(--surface-strong)_82%,white_18%)] px-3 py-2.5 text-sm text-[var(--sea-ink)] outline-none transition focus:border-[var(--lagoon-deep)] focus:ring-3 focus:ring-[rgba(79,184,178,0.22)]"
					/>
				</div>
				<div className="flex items-center gap-2 self-end lg:self-end">
					<Link
						to={actionTo}
						className="rounded-xl border border-[var(--chip-line)] bg-[var(--chip-bg)] px-3 py-2 text-xs font-semibold text-[var(--sea-ink)] no-underline transition hover:-translate-y-0.5"
					>
						{actionLabel}
					</Link>
				</div>
			</div>

			{quickMatches && onQuickSelect && quickMatches.length > 0 ? (
				<div className="mt-3 flex flex-wrap gap-2">
					{quickMatches.map((pokemon) => (
						<span
							key={`quick-${pokemon.key}`}
							className="inline-flex items-center overflow-hidden rounded-full border border-[var(--chip-line)] bg-[var(--chip-bg)]"
						>
							<button
								type="button"
								onClick={() => onQuickSelect(pokemon.key)}
								className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold text-[var(--sea-ink)] transition hover:-translate-y-0.5"
							>
								<PokemonSprite
									pokemon={pokemon}
									size={30}
									className="h-[30px] w-[30px] object-contain"
								/>
								{pokemon.displayName}
							</button>
							<Link
								to="/pokemon/$pokemonKey"
								params={{ pokemonKey: pokemon.key.toLowerCase() }}
								target="_blank"
								rel="noreferrer"
								className="inline-flex items-center border-l border-[var(--chip-line)] px-2 py-1 text-[11px] font-bold text-[var(--lagoon-deep)] no-underline transition hover:bg-[var(--link-bg-hover)]"
								title={`Open ${pokemon.displayName} in a new tab`}
							>
								↗
							</Link>
						</span>
					))}
				</div>
			) : null}
		</section>
	);
}

export function LoadingNotice() {
	return (
		<section className="island-shell mt-7 rounded-2xl p-6">
			<p className="m-0 text-sm font-semibold text-[var(--sea-ink-soft)]">
				Loading Pokemon data...
			</p>
		</section>
	);
}

type ErrorNoticeProps = {
	message: string;
};

export function ErrorNotice({ message }: ErrorNoticeProps) {
	return (
		<section className="island-shell mt-7 rounded-2xl border-red-400/45 p-6">
			<p className="m-0 text-sm font-semibold text-red-600 dark:text-red-300">
				Failed to load data: {message}
			</p>
		</section>
	);
}

type PokemonListTableProps = {
	filteredPokemon: PokemonRecord[];
	pokemonRecordsCount: number;
};

type PokemonListSortColumn = "id" | "pokemon" | "bst" | StatKey;

type PokemonListSort = {
	column: PokemonListSortColumn;
	direction: "asc" | "desc";
};

const LIST_STAT_COLUMNS: StatKey[] = [
	"hp",
	"attack",
	"defense",
	"sp_attack",
	"sp_defense",
	"speed",
];

type PokemonListRowProps = {
	onOpenPokemon: (pokemonKey: string) => void;
	pokemon: PokemonRecord;
};

const PokemonListRow = memo(function PokemonListRow({
	onOpenPokemon,
	pokemon,
}: PokemonListRowProps) {
	const rowTypes = pokemon.types;
	const formattedId = formatPokemonId(pokemon.id);

	return (
		<tr
			tabIndex={0}
			role="link"
			onClick={() => onOpenPokemon(pokemon.key)}
			onKeyDown={(event) => {
				if (event.key === "Enter" || event.key === " ") {
					event.preventDefault();
					onOpenPokemon(pokemon.key);
				}
			}}
			className="cursor-pointer transition-colors hover:bg-[rgba(79,184,178,0.08)] focus-visible:outline-2 focus-visible:outline-[var(--lagoon-deep)] focus-visible:outline-offset-[-2px]"
		>
			<td className="border-t border-[var(--line)] px-3 py-2.5 font-semibold tabular-nums text-[var(--sea-ink-soft)]">
				{formattedId ?? "—"}
			</td>
			<td className="border-t border-[var(--line)] px-3 py-2.5">
				<div className="flex items-center gap-2.5">
					<PokemonSprite
						pokemon={pokemon}
						size={56}
						className="h-14 w-14 flex-shrink-0 object-contain"
					/>
					<div className="min-w-0">
						<p className="m-0 truncate text-sm font-semibold text-[var(--sea-ink)]">
							{pokemon.displayName}
						</p>
					</div>
				</div>
			</td>
			<td className="border-t border-[var(--line)] px-3 py-2.5">
				<div className="flex flex-wrap gap-1.5">
					{rowTypes.length > 0 ? (
						rowTypes.map((type) => {
							const color = getTypeColor(type);
							return (
								<span
									key={`${pokemon.key}-${type}`}
									className="rounded-full border px-2 py-1 text-[10px] font-bold tracking-[0.08em] text-[var(--sea-ink)] uppercase"
									style={{
										backgroundColor: color.bg,
										borderColor: color.border,
									}}
								>
									{type}
								</span>
							);
						})
					) : (
						<span className="text-xs text-[var(--sea-ink-soft)]">Unknown</span>
					)}
				</div>
			</td>
			<td className="border-t border-[var(--line)] px-3 py-2.5 font-bold tabular-nums text-[var(--sea-ink)]">
				{pokemon.total}
			</td>
			{LIST_STAT_COLUMNS.map((statKey) => {
				const value = pokemon.baseStats[statKey] ?? EMPTY_STATS[statKey];
				return (
					<td
						key={`list-stat-${pokemon.key}-${statKey}`}
						className="border-t border-[var(--line)] px-3 py-2.5 font-semibold tabular-nums text-[var(--sea-ink)]"
					>
						{value}
					</td>
				);
			})}
		</tr>
	);
});

function getNumericSortValue(
	pokemon: PokemonRecord,
	column: Exclude<PokemonListSortColumn, "id" | "pokemon">,
): number {
	if (column === "bst") {
		return pokemon.total;
	}

	return pokemon.baseStats[column];
}

export function PokemonListTable({
	filteredPokemon,
	pokemonRecordsCount,
}: PokemonListTableProps) {
	const [isSortPending, startSortTransition] = useTransition();
	const [sort, setSort] = useState<PokemonListSort>({
		column: "id",
		direction: "asc",
	});

	const nameCollator = useMemo(
		() => new Intl.Collator(undefined, { sensitivity: "base" }),
		[],
	);

	const openPokemonInNewTab = useCallback((pokemonKey: string) => {
		if (typeof window === "undefined") {
			return;
		}

		const encodedPokemonKey = encodeURIComponent(pokemonKey.toLowerCase());
		window.open(`/pokemon/${encodedPokemonKey}`, "_blank", "noopener,noreferrer");
	}, []);

	const sortedPokemon = useMemo(() => {
		const sortable = [...filteredPokemon];

		sortable.sort((left, right) => {
			const leftHasId = typeof left.id === "number";
			const rightHasId = typeof right.id === "number";

			if (sort.column === "id") {
				if (leftHasId !== rightHasId) {
					return leftHasId ? -1 : 1;
				}

				if (leftHasId && rightHasId) {
					const idDelta = (left.id as number) - (right.id as number);
					if (idDelta !== 0) {
						return sort.direction === "asc" ? idDelta : -idDelta;
					}
				}

				return nameCollator.compare(left.displayName, right.displayName);
			}

			if (sort.column === "pokemon") {
				const nameDelta = nameCollator.compare(left.displayName, right.displayName);
				if (nameDelta !== 0) {
					return sort.direction === "asc" ? nameDelta : -nameDelta;
				}

				if (leftHasId && rightHasId) {
					return (left.id as number) - (right.id as number);
				}

				if (leftHasId !== rightHasId) {
					return leftHasId ? -1 : 1;
				}

				return nameCollator.compare(left.key, right.key);
			}

			const leftValue = getNumericSortValue(left, sort.column);
			const rightValue = getNumericSortValue(right, sort.column);
			const valueDelta = leftValue - rightValue;
			if (valueDelta !== 0) {
				return sort.direction === "asc" ? valueDelta : -valueDelta;
			}

			if (leftHasId && rightHasId) {
				const idDelta = (left.id as number) - (right.id as number);
				if (idDelta !== 0) {
					return idDelta;
				}
			}

			if (leftHasId !== rightHasId) {
				return leftHasId ? -1 : 1;
			}

			return nameCollator.compare(left.displayName, right.displayName);
		});

		return sortable;
	}, [filteredPokemon, nameCollator, sort]);

	const getSortIndicator = (column: PokemonListSortColumn) =>
		sort.column === column ? (sort.direction === "asc" ? "↑" : "↓") : "↕";

	const applySort = (
		column: PokemonListSortColumn,
		defaultDirection: "asc" | "desc",
	) => {
		startSortTransition(() => {
			setSort((current) => {
				if (current.column === column) {
					return {
						column,
						direction: current.direction === "asc" ? "desc" : "asc",
					};
				}

				return { column, direction: defaultDirection };
			});
		});
	};

	return (
		<section className="island-shell mt-7 rounded-2xl p-4 sm:p-5">
			<p className="text-xs font-semibold tracking-[0.12em] text-[var(--sea-ink-soft)] uppercase">
				{filteredPokemon.length} shown / {pokemonRecordsCount} total
			</p>
			{isSortPending ? (
				<p className="mt-1 text-[11px] font-semibold text-[var(--sea-ink-soft)]">
					Sorting...
				</p>
			) : null}

			<div className="mt-3 overflow-auto rounded-xl border border-[var(--line)]">
				<table className="w-full min-w-[1180px] border-collapse text-sm">
					<thead className="sticky top-0 bg-[color-mix(in_oklab,var(--surface-strong)_86%,white_14%)]">
						<tr>
							<th className="px-3 py-2 text-left text-xs font-bold tracking-[0.1em] text-[var(--sea-ink-soft)] uppercase">
								<button
									type="button"
									onClick={() => applySort("id", "desc")}
									className="inline-flex items-center gap-1 text-inherit"
									title="Sort by ID"
								>
									ID
									<span aria-hidden="true">{getSortIndicator("id")}</span>
								</button>
							</th>
							<th className="px-3 py-2 text-left text-xs font-bold tracking-[0.1em] text-[var(--sea-ink-soft)] uppercase">
								<button
									type="button"
									onClick={() => applySort("pokemon", "asc")}
									className="inline-flex items-center gap-1 text-inherit"
									title="Sort by Pokemon name"
								>
									Pokemon
									<span aria-hidden="true">{getSortIndicator("pokemon")}</span>
								</button>
							</th>
							<th className="px-3 py-2 text-left text-xs font-bold tracking-[0.1em] text-[var(--sea-ink-soft)] uppercase">
								Types
							</th>
							<th className="px-3 py-2 text-left text-xs font-bold tracking-[0.1em] text-[var(--sea-ink-soft)] uppercase">
								<button
									type="button"
									onClick={() => applySort("bst", "desc")}
									className="inline-flex items-center gap-1 text-inherit"
									title="Sort by BST"
								>
									BST
									<span aria-hidden="true">{getSortIndicator("bst")}</span>
								</button>
							</th>
							{STAT_ROWS.map((row) => (
								<th
									key={`header-${row.key}`}
									className="px-3 py-2 text-left text-xs font-bold tracking-[0.1em] text-[var(--sea-ink-soft)] uppercase"
								>
									<button
										type="button"
										onClick={() => applySort(row.key, "desc")}
										className="inline-flex items-center gap-1 text-inherit"
										title={`Sort by ${row.label}`}
									>
										{STAT_LIST_LABELS[row.key]}
										<span aria-hidden="true">{getSortIndicator(row.key)}</span>
									</button>
								</th>
							))}
						</tr>
					</thead>
					<tbody>
						{sortedPokemon.length > 0 ? (
							sortedPokemon.map((pokemon) => (
								<PokemonListRow
									key={`list-row-${pokemon.key}`}
									onOpenPokemon={openPokemonInNewTab}
									pokemon={pokemon}
								/>
							))
						) : (
							<tr>
								<td
									colSpan={10}
									className="border-t border-[var(--line)] px-3 py-5 text-sm text-[var(--sea-ink-soft)]"
								>
									No Pokemon match this search.
								</td>
							</tr>
						)}
					</tbody>
				</table>
			</div>
		</section>
	);
}

type NoResultsCardProps = {
	message?: string;
};

export function NoResultsCard({
	message = "No Pokemon match this search.",
}: NoResultsCardProps) {
	return (
		<article className="island-shell rounded-2xl p-6">
			<p className="m-0 text-sm text-[var(--sea-ink-soft)]">{message}</p>
		</article>
	);
}

type PokemonSummaryCardProps = {
	selectedPokemon: PokemonRecord;
	selectedPokemonTypes: string[];
};

export function PokemonSummaryCard({
	selectedPokemon,
	selectedPokemonTypes,
}: PokemonSummaryCardProps) {
	const formattedNationalId = formatPokemonId(selectedPokemon.id);

	return (
		<article className="island-shell rise-in rounded-2xl p-5 sm:p-6">
			<div className="flex flex-wrap items-start justify-between gap-3">
				<div className="flex items-start gap-4">
					<a
						href={`https://pokemondb.net/pokedex/${selectedPokemon.baseSlug}`}
						target="_blank"
						rel="noreferrer"
						className="group inline-flex rounded-2xl border border-[var(--line)] p-2 transition hover:-translate-y-0.5 hover:border-[rgba(50,143,151,0.45)]"
						title={`Open ${selectedPokemon.displayName} on PokemonDB`}
					>
						<PokemonSprite
							pokemon={selectedPokemon}
							size={132}
							className="h-[132px] w-[132px] object-contain"
						/>
					</a>
					<div>
						<h2 className="display-title m-0 text-3xl font-bold tracking-tight sm:text-4xl">
							{selectedPokemon.displayName}
						</h2>
						<p className="mt-1 mb-0 text-xs font-semibold tracking-[0.08em] text-[var(--sea-ink-soft)] uppercase">
							{formattedNationalId
								? `National ID ${formattedNationalId}`
								: "National ID unavailable"}
						</p>
						<div className="mt-2 flex flex-wrap gap-1.5">
							{selectedPokemonTypes.map((type) => {
								const color = getTypeColor(type);

								return (
									<span
										key={type}
										className="rounded-full border px-2.5 py-1 text-[11px] font-extrabold tracking-[0.08em] text-[var(--sea-ink)] uppercase"
										style={{
											backgroundColor: color.bg,
											borderColor: color.border,
										}}
									>
										{type}
									</span>
								);
							})}
							{selectedPokemonTypes.length === 0 ? (
								<span className="rounded-full border border-[var(--line)] bg-[rgba(255,255,255,0.5)] px-2.5 py-1 text-[11px] font-semibold text-[var(--sea-ink-soft)]">
									Type unknown
								</span>
							) : null}
						</div>
            <div className="mt-2 flex flex-wrap items-center gap-3">
              <Link
                to="/pokemon/$pokemonKey"
                params={{ pokemonKey: selectedPokemon.key.toLowerCase() }}
                target="_blank"
                rel="noreferrer"
                className="text-xs font-semibold no-underline"
              >
                Open in new tab
              </Link>
              <a
                href={`https://pokemondb.net/pokedex/${selectedPokemon.baseSlug}`}
                target="_blank"
                rel="noreferrer"
                className="text-xs font-semibold"
              >
                View on PokemonDB
              </a>
            </div>
          </div>
        </div>

				<div className="rounded-2xl border border-[rgba(50,143,151,0.26)] bg-[rgba(79,184,178,0.12)] px-4 py-3 text-right">
					<p className="m-0 text-xs font-bold tracking-[0.14em] text-[var(--kicker)] uppercase">
						Total
					</p>
					<p className="m-0 text-3xl font-extrabold text-[var(--lagoon-deep)]">
						{selectedPokemon.total}
					</p>
				</div>
			</div>

			<div className="mt-6 space-y-3">
				{STAT_ROWS.map((row) => {
					const value =
						selectedPokemon.baseStats[row.key] ?? EMPTY_STATS[row.key];
					const width = Math.min(100, (value / STAT_CAP) * 100);

					return (
						<div
							key={row.key}
							className="grid grid-cols-[80px_minmax(0,1fr)_48px] items-center gap-3"
						>
							<span className="text-xs font-bold tracking-[0.1em] text-[var(--sea-ink-soft)] uppercase">
								{row.label}
							</span>
							<div className="h-3 rounded-full bg-[rgba(17,44,49,0.13)] p-[2px]">
								<div
									className="h-full rounded-full shadow-[0_3px_12px_rgba(0,0,0,0.16)] transition-all duration-500"
									style={{
										width: `${width}%`,
										backgroundImage: getStatBarGradient(value),
									}}
								/>
							</div>
							<span className="text-right text-sm font-semibold tabular-nums text-[var(--sea-ink)]">
								{value}
							</span>
						</div>
					);
				})}
			</div>
		</article>
	);
}

type EvolutionPathCardProps = {
	evolutionFromLinks: EvolutionLink[];
	evolutionToLinks: EvolutionLink[];
	onJumpToPokemon: (key: string) => void;
};

export function EvolutionPathCard({
	evolutionFromLinks,
	evolutionToLinks,
	onJumpToPokemon,
}: EvolutionPathCardProps) {
	return (
		<section className="island-shell rounded-2xl p-5">
			<div className="mb-3 flex items-center justify-between gap-2">
				<h3 className="m-0 text-lg font-bold text-[var(--sea-ink)]">
					Evolution Path
				</h3>
				<span className="rounded-full border border-[var(--line)] px-2.5 py-0.5 text-xs font-semibold text-[var(--sea-ink-soft)]">
					{evolutionFromLinks.length + evolutionToLinks.length} links
				</span>
			</div>

			<div className="space-y-4">
				<div>
					<p className="mb-2 text-xs font-bold tracking-[0.12em] text-[var(--kicker)] uppercase">
						Evolves From
					</p>
					{evolutionFromLinks.length > 0 ? (
						<div className="space-y-2">
							{evolutionFromLinks.map((link, index) => (
								<div
									key={`from-${link.sourceKey}-${link.targetKey}-${link.method}-${index}`}
									className="rounded-xl border border-[var(--line)] bg-transparent px-3 py-2"
								>
									<div className="flex flex-wrap items-center gap-2 text-sm font-semibold">
										<button
											type="button"
											onClick={() => onJumpToPokemon(link.sourceKey)}
											className="rounded-lg border border-[var(--chip-line)] bg-[var(--chip-bg)] px-2 py-0.5 text-[var(--sea-ink)] transition hover:-translate-y-0.5"
										>
											{toDisplayLabel(link.sourceKey)}
										</button>
										<span
											aria-hidden="true"
											className="text-[var(--sea-ink-soft)]"
										>
											→
										</span>
										<span className="text-[var(--sea-ink)]">
											{toDisplayLabel(link.targetKey)}
										</span>
									</div>
									<p className="mt-1 mb-0 text-xs text-[var(--sea-ink-soft)]">
										{describeEvolutionRequirement(
											link.method,
											link.parameter,
											link.extra,
										)}
									</p>
								</div>
							))}
						</div>
					) : (
						<p className="m-0 rounded-xl border border-[var(--line)] bg-transparent px-3 py-3 text-sm text-[var(--sea-ink-soft)]">
							No previous evolution found.
						</p>
					)}
				</div>

				<div>
					<p className="mb-2 text-xs font-bold tracking-[0.12em] text-[var(--kicker)] uppercase">
						Evolves To
					</p>
					{evolutionToLinks.length > 0 ? (
						<div className="space-y-2">
							{evolutionToLinks.map((link, index) => (
								<div
									key={`to-${link.sourceKey}-${link.targetKey}-${link.method}-${index}`}
									className="rounded-xl border border-[var(--line)] bg-transparent px-3 py-2"
								>
									<div className="flex flex-wrap items-center gap-2 text-sm font-semibold">
										<span className="text-[var(--sea-ink)]">
											{toDisplayLabel(link.sourceKey)}
										</span>
										<span
											aria-hidden="true"
											className="text-[var(--sea-ink-soft)]"
										>
											→
										</span>
										<button
											type="button"
											onClick={() => onJumpToPokemon(link.targetKey)}
											className="rounded-lg border border-[var(--chip-line)] bg-[var(--chip-bg)] px-2 py-0.5 text-[var(--sea-ink)] transition hover:-translate-y-0.5"
										>
											{toDisplayLabel(link.targetKey)}
										</button>
									</div>
									<p className="mt-1 mb-0 text-xs text-[var(--sea-ink-soft)]">
										{describeEvolutionRequirement(
											link.method,
											link.parameter,
											link.extra,
										)}
									</p>
								</div>
							))}
						</div>
					) : (
						<p className="m-0 rounded-xl border border-[var(--line)] bg-transparent px-3 py-3 text-sm text-[var(--sea-ink-soft)]">
							No further evolution found.
						</p>
					)}
				</div>
			</div>
		</section>
	);
}

type TypeDefensesCardProps = {
	selectedDefensiveMultipliers: DefenseMultiplierMap | null;
	selectedPokemonName: string;
	selectedPokemonTypes: string[];
};

export function TypeDefensesCard({
	selectedDefensiveMultipliers,
	selectedPokemonName,
	selectedPokemonTypes,
}: TypeDefensesCardProps) {
	return (
		<section className="rounded-2xl border border-[var(--line)] bg-[var(--bg-base)] p-4 sm:p-5">
			<h3 className="m-0 text-lg font-bold text-[var(--sea-ink)]">
				Type Defenses
			</h3>
			<p className="mt-1 mb-0 text-sm text-[var(--sea-ink-soft)]">
				The effectiveness of each attacking type on{" "}
				<span className="font-semibold">{selectedPokemonName}</span>.
			</p>

			{selectedPokemonTypes.length > 0 && selectedDefensiveMultipliers ? (
				<div className="mt-4 space-y-3">
					{TYPE_DEFENSE_ROWS.map((row) => (
						<div
							key={`defense-row-${row.join("-")}`}
							className="grid grid-cols-9 gap-1.5"
						>
							{row.map((attackType) => {
								const typeColor = getTypeColor(attackType);
								const multiplier = selectedDefensiveMultipliers[attackType];
								const multiplierTone = getDefenseMultiplierTone(multiplier);
								const isNeutral = multiplier === 1;

								return (
									<div key={`defense-${attackType}`} className="space-y-1">
										<span
											className="flex h-9 items-center justify-center rounded-md border text-[11px] font-extrabold tracking-[0.06em] text-[var(--sea-ink)] uppercase"
											style={{
												backgroundColor: typeColor.bg,
												borderColor: typeColor.border,
											}}
											title={toDisplayLabel(attackType)}
										>
											{attackType.slice(0, 3).toUpperCase()}
										</span>

										{isNeutral ? (
											<div className="h-7 rounded-md border border-transparent" />
										) : (
											<span
												className="flex h-7 items-center justify-center rounded-md border text-xs font-bold tabular-nums"
												style={{
													backgroundColor: multiplierTone.bg,
													borderColor: multiplierTone.border,
													color: multiplierTone.text,
												}}
												title={getDefensiveMatchupLabel(multiplier)}
											>
												{formatMultiplier(multiplier)}
											</span>
										)}
									</div>
								);
							})}
						</div>
					))}
				</div>
			) : (
				<p className="mt-3 mb-0 rounded-xl border border-[var(--line)] bg-[rgba(255,255,255,0.45)] px-3 py-3 text-sm text-[var(--sea-ink-soft)]">
					Type matchup card unavailable for this Pokemon.
				</p>
			)}
		</section>
	);
}

type LearnSetCardProps = {
	pokemon: PokemonRecord;
};

export function LearnSetCard({ pokemon }: LearnSetCardProps) {
	return (
		<section className="island-shell rounded-2xl p-5">
			<div className="mb-3 flex items-center justify-between gap-2">
				<h3 className="m-0 text-lg font-bold text-[var(--sea-ink)]">
					Learn Set
				</h3>
				<span className="rounded-full border border-[var(--line)] px-2.5 py-0.5 text-xs font-semibold text-[var(--sea-ink-soft)]">
					{pokemon.learnSet.length} moves
				</span>
			</div>
			<div className="max-h-[320px] overflow-auto rounded-xl border border-[var(--line)]">
				<table className="w-full border-collapse text-sm">
					<thead className="sticky top-0 bg-[color-mix(in_oklab,var(--surface-strong)_86%,white_14%)]">
						<tr>
							<th className="px-3 py-2 text-left text-xs font-bold tracking-[0.1em] text-[var(--sea-ink-soft)] uppercase">
								Level
							</th>
							<th className="px-3 py-2 text-left text-xs font-bold tracking-[0.1em] text-[var(--sea-ink-soft)] uppercase">
								Move
							</th>
						</tr>
					</thead>
					<tbody>
						{pokemon.learnSet.length > 0 ? (
							pokemon.learnSet.map((move, index) => (
								<tr key={`${move.level}-${move.move}-${index}`}>
									<td className="border-t border-[var(--line)] px-3 py-1.5 font-semibold tabular-nums">
										{move.level}
									</td>
									<td className="border-t border-[var(--line)] px-3 py-1.5">
										{toDisplayLabel(move.move)}
									</td>
								</tr>
							))
						) : (
							<tr>
								<td
									className="px-3 py-4 text-sm text-[var(--sea-ink-soft)]"
									colSpan={2}
								>
									No learn set moves listed.
								</td>
							</tr>
						)}
					</tbody>
				</table>
			</div>
		</section>
	);
}

type EggMovesCardProps = {
	pokemon: PokemonRecord;
};

export function EggMovesCard({ pokemon }: EggMovesCardProps) {
	return (
		<section className="island-shell rounded-2xl p-5">
			<div className="mb-3 flex items-center justify-between gap-2">
				<h3 className="m-0 text-lg font-bold text-[var(--sea-ink)]">
					Egg Moves
				</h3>
				<span className="rounded-full border border-[var(--line)] px-2.5 py-0.5 text-xs font-semibold text-[var(--sea-ink-soft)]">
					{pokemon.eggMoves.length} moves
				</span>
			</div>
			<div className="max-h-[320px] overflow-auto rounded-xl border border-[var(--line)]">
				<table className="w-full border-collapse text-sm">
					<thead className="sticky top-0 bg-[color-mix(in_oklab,var(--surface-strong)_86%,white_14%)]">
						<tr>
							<th className="px-3 py-2 text-left text-xs font-bold tracking-[0.1em] text-[var(--sea-ink-soft)] uppercase">
								Move
							</th>
						</tr>
					</thead>
					<tbody>
						{pokemon.eggMoves.length > 0 ? (
							pokemon.eggMoves.map((move) => (
								<tr key={move}>
									<td className="border-t border-[var(--line)] px-3 py-1.5">
										{toDisplayLabel(move)}
									</td>
								</tr>
							))
						) : (
							<tr>
								<td className="px-3 py-4 text-sm text-[var(--sea-ink-soft)]">
									No egg moves listed.
								</td>
							</tr>
						)}
					</tbody>
				</table>
			</div>
		</section>
	);
}
