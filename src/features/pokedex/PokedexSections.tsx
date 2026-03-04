import { memo, useCallback, useMemo, useState, useTransition } from "react";
import { Link } from "@tanstack/react-router";
import {
	EMPTY_STATS,
	STAT_CAP,
	STAT_LIST_LABELS,
	STAT_ROWS,
	TOTAL_STAT_CAP,
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
	getTotalStatBarGradient,
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
			<td className="w-[58px] border-t border-[var(--line)] px-2 py-2 text-center text-xs font-semibold tabular-nums text-[var(--sea-ink-soft)]">
				{formattedId ?? "—"}
			</td>
			<td className="border-t border-[var(--line)] px-2 py-2">
				<div className="flex items-center gap-2.5">
					<PokemonSprite
						pokemon={pokemon}
						size={56}
						className="h-14 w-14 flex-shrink-0 object-contain"
					/>
					<div className="min-w-0">
						<p className="m-0 truncate text-[13px] font-semibold text-[var(--sea-ink)]">
							{pokemon.displayName}
						</p>
					</div>
				</div>
			</td>
			<td className="w-[96px] border-t border-[var(--line)] px-2 py-2">
				<div className="inline-flex min-w-full flex-col gap-1">
					{rowTypes.length > 0 ? (
						rowTypes.map((type) => {
							const color = getTypeColor(type);
							return (
								<span
									key={`${pokemon.key}-${type}`}
									className="inline-flex justify-center rounded-md border px-1.5 py-0.5 text-[9px] font-extrabold leading-none tracking-[0.06em] text-[var(--sea-ink)] uppercase"
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
						<span className="text-center text-[11px] text-[var(--sea-ink-soft)]">
							Unknown
						</span>
					)}
				</div>
			</td>
			<td className="w-[64px] border-t border-[var(--line)] px-2 py-2 text-center text-xs font-bold tabular-nums text-[var(--sea-ink)]">
				{pokemon.total}
			</td>
			{LIST_STAT_COLUMNS.map((statKey) => {
				const value = pokemon.baseStats[statKey] ?? EMPTY_STATS[statKey];
				return (
					<td
						key={`list-stat-${pokemon.key}-${statKey}`}
						className="w-[56px] border-t border-[var(--line)] px-1.5 py-2 text-center text-xs font-semibold tabular-nums text-[var(--sea-ink)]"
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

			<div className="mt-3 overflow-hidden rounded-xl border border-[var(--line)]">
				<table className="w-full table-fixed border-collapse text-xs sm:text-sm">
					<thead className="sticky top-0 bg-[color-mix(in_oklab,var(--surface-strong)_86%,white_14%)]">
						<tr>
							<th className="w-[58px] px-2 py-2 text-center text-[11px] font-bold tracking-[0.08em] text-[var(--sea-ink-soft)] uppercase">
								<button
									type="button"
									onClick={() => applySort("id", "desc")}
									className="inline-flex w-full items-center justify-center gap-1 text-inherit"
									title="Sort by ID"
								>
									ID
									<span aria-hidden="true">{getSortIndicator("id")}</span>
								</button>
							</th>
							<th className="w-[230px] px-2 py-2 text-left text-[11px] font-bold tracking-[0.08em] text-[var(--sea-ink-soft)] uppercase">
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
							<th className="w-[96px] px-2 py-2 text-center text-[11px] font-bold tracking-[0.08em] text-[var(--sea-ink-soft)] uppercase">
								Types
							</th>
							<th className="w-[64px] px-2 py-2 text-center text-[11px] font-bold tracking-[0.08em] text-[var(--sea-ink-soft)] uppercase">
								<button
									type="button"
									onClick={() => applySort("bst", "desc")}
									className="inline-flex w-full items-center justify-center gap-1 text-inherit"
									title="Sort by BST"
								>
									BST
									<span aria-hidden="true">{getSortIndicator("bst")}</span>
								</button>
							</th>
							{STAT_ROWS.map((row) => (
								<th
									key={`header-${row.key}`}
									className="w-[56px] px-1.5 py-2 text-center text-[11px] font-bold tracking-[0.08em] text-[var(--sea-ink-soft)] uppercase"
								>
									<button
										type="button"
										onClick={() => applySort(row.key, "desc")}
										className="inline-flex w-full items-center justify-center gap-1 text-inherit"
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
	pokemonRecords: PokemonRecord[];
	onJumpToPokemon: (key: string) => void;
};

function formatOptionalToken(value: string | null | undefined): string {
	return typeof value === "string" && value.length > 0
		? toDisplayLabel(value)
		: "None";
}

export function PokemonSummaryCard({
	selectedPokemon,
	selectedPokemonTypes,
	pokemonRecords,
	onJumpToPokemon,
}: PokemonSummaryCardProps) {
	const formattedNationalId = formatPokemonId(selectedPokemon.id);
	const abilityEntries = [
		{
			label: "Primary",
			value: formatOptionalToken(selectedPokemon.abilities?.primary),
		},
		{
			label: "Secondary",
			value: formatOptionalToken(selectedPokemon.abilities?.secondary),
		},
		{
			label: "Hidden",
			value: formatOptionalToken(selectedPokemon.abilities?.hidden),
		},
	];
	const totalWidth = Math.min(
		100,
		Math.max(0, (selectedPokemon.total / TOTAL_STAT_CAP) * 100),
	);

	return (
		<article className="island-shell rise-in rounded-2xl p-5 sm:p-6">
			<div className="flex flex-wrap items-start gap-3">
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
						<div className="mt-3">
							<p className="m-0 text-[11px] font-bold tracking-[0.1em] text-[var(--kicker)] uppercase">
								Abilities
							</p>
							<div className="mt-1.5 flex flex-wrap gap-1.5">
								{abilityEntries.map((ability) => (
									<span
										key={`ability-${ability.label}`}
										className="rounded-full border border-[var(--chip-line)] bg-[var(--chip-bg)] px-2.5 py-1 text-[11px] font-semibold text-[var(--sea-ink)]"
									>
										{ability.label}: {ability.value}
									</span>
								))}
							</div>
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
				<div className="mt-5 grid grid-cols-[80px_minmax(0,1fr)_72px] items-center gap-3 border-t border-[var(--line)] pt-3">
					<span className="text-xs font-bold tracking-[0.1em] text-[var(--sea-ink-soft)] uppercase">
						Total
					</span>
					<div className="h-3 rounded-full bg-[rgba(17,44,49,0.13)] p-[2px]">
						<div
							className="h-full rounded-full shadow-[0_3px_12px_rgba(0,0,0,0.16)] transition-all duration-500"
							style={{
								width: `${totalWidth}%`,
								backgroundImage: getTotalStatBarGradient(selectedPokemon.total),
							}}
						/>
					</div>
					<span className="text-right text-sm font-semibold tabular-nums text-[var(--sea-ink)]">
						{selectedPokemon.total}
					</span>
				</div>
			</div>

			<EvolutionPathCard
				selectedPokemon={selectedPokemon}
				pokemonRecords={pokemonRecords}
				onJumpToPokemon={onJumpToPokemon}
				compact
				inline
			/>
		</article>
	);
}

type InfoCardProps = {
	pokemon: PokemonRecord;
};

export function InfoCard({ pokemon }: InfoCardProps) {
	const eggGroupLabel =
		pokemon.eggGroups.length > 0
			? pokemon.eggGroups.map((group) => toDisplayLabel(group)).join(", ")
			: "Unknown";
	const heldItemCommon = formatOptionalToken(pokemon.heldItems?.common);
	const heldItemRare = formatOptionalToken(pokemon.heldItems?.rare);
	const growthRate = formatOptionalToken(pokemon.growthRate);
	const catchRate =
		typeof pokemon.catchRate === "number" ? `${pokemon.catchRate}` : "Unknown";

	return (
		<section className="island-shell rounded-2xl p-5">
			<h3 className="m-0 text-lg font-bold text-[var(--sea-ink)]">Info</h3>
			<div className="mt-3 space-y-2">
				<div className="grid grid-cols-[96px_minmax(0,1fr)] gap-2 text-sm">
					<span className="text-xs font-bold tracking-[0.08em] text-[var(--sea-ink-soft)] uppercase">
						Egg Group
					</span>
					<span className="font-semibold text-[var(--sea-ink)]">{eggGroupLabel}</span>
				</div>
				<div className="grid grid-cols-[96px_minmax(0,1fr)] gap-2 text-sm">
					<span className="text-xs font-bold tracking-[0.08em] text-[var(--sea-ink-soft)] uppercase">
						Held
					</span>
					<span className="font-semibold text-[var(--sea-ink)]">
						Common: {heldItemCommon}
						<br />
						Rare: {heldItemRare}
					</span>
				</div>
				<div className="grid grid-cols-[96px_minmax(0,1fr)] gap-2 text-sm">
					<span className="text-xs font-bold tracking-[0.08em] text-[var(--sea-ink-soft)] uppercase">
						Growth
					</span>
					<span className="font-semibold text-[var(--sea-ink)]">{growthRate}</span>
				</div>
				<div className="grid grid-cols-[96px_minmax(0,1fr)] gap-2 text-sm">
					<span className="text-xs font-bold tracking-[0.08em] text-[var(--sea-ink-soft)] uppercase">
						Catch Rate
					</span>
					<span className="font-semibold text-[var(--sea-ink)]">{catchRate}</span>
				</div>
			</div>
		</section>
	);
}

type EvolutionPathCardProps = {
	selectedPokemon: PokemonRecord;
	pokemonRecords: PokemonRecord[];
	onJumpToPokemon: (key: string) => void;
	compact?: boolean;
	inline?: boolean;
};

const FORM_ONLY_EVOLUTION_METHODS = new Set(["MEGA", "GIGANTAMAX"]);
const MAX_EVOLUTION_PATH_COUNT = 999;

function getPokemonRecordIdSortValue(record: PokemonRecord | undefined): number {
	if (!record || typeof record.id !== "number") {
		return Number.POSITIVE_INFINITY;
	}

	return record.id;
}

function compareEvolutionLinks(
	left: EvolutionLink,
	right: EvolutionLink,
	recordByKey: Map<string, PokemonRecord>,
): number {
	const leftMethodPenalty = FORM_ONLY_EVOLUTION_METHODS.has(
		left.method.toUpperCase(),
	)
		? 1
		: 0;
	const rightMethodPenalty = FORM_ONLY_EVOLUTION_METHODS.has(
		right.method.toUpperCase(),
	)
		? 1
		: 0;
	if (leftMethodPenalty !== rightMethodPenalty) {
		return leftMethodPenalty - rightMethodPenalty;
	}

	const leftSourceId = getPokemonRecordIdSortValue(recordByKey.get(left.sourceKey));
	const rightSourceId = getPokemonRecordIdSortValue(
		recordByKey.get(right.sourceKey),
	);
	if (leftSourceId !== rightSourceId) {
		return leftSourceId - rightSourceId;
	}

	const leftTargetId = getPokemonRecordIdSortValue(recordByKey.get(left.targetKey));
	const rightTargetId = getPokemonRecordIdSortValue(
		recordByKey.get(right.targetKey),
	);
	if (leftTargetId !== rightTargetId) {
		return leftTargetId - rightTargetId;
	}

	const leftSourceName =
		recordByKey.get(left.sourceKey)?.displayName ?? left.sourceKey;
	const rightSourceName =
		recordByKey.get(right.sourceKey)?.displayName ?? right.sourceKey;
	const sourceNameCompare = leftSourceName.localeCompare(rightSourceName);
	if (sourceNameCompare !== 0) {
		return sourceNameCompare;
	}

	const leftTargetName =
		recordByKey.get(left.targetKey)?.displayName ?? left.targetKey;
	const rightTargetName =
		recordByKey.get(right.targetKey)?.displayName ?? right.targetKey;
	const targetNameCompare = leftTargetName.localeCompare(rightTargetName);
	if (targetNameCompare !== 0) {
		return targetNameCompare;
	}

	return left.method.localeCompare(right.method);
}

function comparePokemonKeys(
	leftKey: string,
	rightKey: string,
	recordByKey: Map<string, PokemonRecord>,
): number {
	const leftRecord = recordByKey.get(leftKey);
	const rightRecord = recordByKey.get(rightKey);

	const leftId = getPokemonRecordIdSortValue(leftRecord);
	const rightId = getPokemonRecordIdSortValue(rightRecord);
	if (leftId !== rightId) {
		return leftId - rightId;
	}

	const leftName = leftRecord?.displayName ?? leftKey;
	const rightName = rightRecord?.displayName ?? rightKey;
	const nameCompare = leftName.localeCompare(rightName);
	if (nameCompare !== 0) {
		return nameCompare;
	}

	return leftKey.localeCompare(rightKey);
}

type EvolutionBranch = {
	targetKey: string;
	links: EvolutionLink[];
};

function getEvolutionRequirementLines(links: EvolutionLink[]): string[] {
	const seen = new Set<string>();
	const lines: string[] = [];

	for (const link of links) {
		const requirement = describeEvolutionRequirement(
			link.method,
			link.parameter,
			link.extra,
		);
		if (seen.has(requirement)) {
			continue;
		}

		seen.add(requirement);
		lines.push(requirement);
	}

	return lines;
}

export function EvolutionPathCard({
	selectedPokemon,
	pokemonRecords,
	onJumpToPokemon,
	compact = false,
	inline = false,
}: EvolutionPathCardProps) {
	const evolutionLayout = useMemo(() => {
		const recordByKey = new Map<string, PokemonRecord>(
			pokemonRecords.map((record) => [record.key, record]),
		);
		const outgoingBySource = new Map<string, EvolutionLink[]>();
		const incomingByTarget = new Map<string, EvolutionLink[]>();

		for (const sourcePokemon of pokemonRecords) {
			for (const step of sourcePokemon.evolutionTable) {
				if (!recordByKey.has(step.target)) {
					continue;
				}

				const link: EvolutionLink = {
					sourceKey: sourcePokemon.key,
					targetKey: step.target,
					method: step.method,
					parameter: step.parameter,
					extra: step.extra,
				};

				const outgoingLinks = outgoingBySource.get(sourcePokemon.key);
				if (outgoingLinks) {
					outgoingLinks.push(link);
				} else {
					outgoingBySource.set(sourcePokemon.key, [link]);
				}

				const incomingLinks = incomingByTarget.get(step.target);
				if (incomingLinks) {
					incomingLinks.push(link);
				} else {
					incomingByTarget.set(step.target, [link]);
				}
			}
		}

		for (const links of outgoingBySource.values()) {
			links.sort((left, right) =>
				compareEvolutionLinks(left, right, recordByKey),
			);
		}
		for (const links of incomingByTarget.values()) {
			links.sort((left, right) =>
				compareEvolutionLinks(left, right, recordByKey),
			);
		}

		if (!recordByKey.has(selectedPokemon.key)) {
			return {
				outgoingBranchesBySource: new Map<string, EvolutionBranch[]>(),
				pathCount: 0,
				recordByKey,
				rootKeys: [] as string[],
				stageCount: 0,
			};
		}

		const componentKeys = new Set<string>([selectedPokemon.key]);
		const queue: string[] = [selectedPokemon.key];

		while (queue.length > 0) {
			const currentKey = queue.shift();
			if (!currentKey) {
				continue;
			}

			const neighborKeys = [
				...(outgoingBySource.get(currentKey) ?? []).map(
					(link) => link.targetKey,
				),
				...(incomingByTarget.get(currentKey) ?? []).map(
					(link) => link.sourceKey,
				),
			];

			for (const neighborKey of neighborKeys) {
				if (componentKeys.has(neighborKey)) {
					continue;
				}

				componentKeys.add(neighborKey);
				queue.push(neighborKey);
			}
		}

		const roots = [...componentKeys]
			.filter((key) =>
				(incomingByTarget.get(key) ?? []).every(
					(link) => !componentKeys.has(link.sourceKey),
				),
			)
			.sort((leftKey, rightKey) =>
				comparePokemonKeys(leftKey, rightKey, recordByKey),
			);

		if (roots.length === 0) {
			roots.push(selectedPokemon.key);
		}

		const outgoingBranchesBySource = new Map<string, EvolutionBranch[]>();
		for (const sourceKey of componentKeys) {
			const sourceLinks = (outgoingBySource.get(sourceKey) ?? []).filter((link) =>
				componentKeys.has(link.targetKey),
			);
			if (sourceLinks.length === 0) {
				continue;
			}

			const linksByTarget = new Map<string, EvolutionLink[]>();
			for (const link of sourceLinks) {
				const branchLinks = linksByTarget.get(link.targetKey) ?? [];
				const linkKey = `${link.method}:${String(link.parameter)}:${String(link.extra)}`;
				const hasDuplicate = branchLinks.some(
					(existingLink) =>
						`${existingLink.method}:${String(existingLink.parameter)}:${String(existingLink.extra)}` ===
						linkKey,
				);
				if (!hasDuplicate) {
					branchLinks.push(link);
					linksByTarget.set(link.targetKey, branchLinks);
				}
			}

			const branches: EvolutionBranch[] = [...linksByTarget.entries()]
				.map(([targetKey, links]) => ({
					targetKey,
					links: [...links].sort((left, right) =>
						compareEvolutionLinks(left, right, recordByKey),
					),
				}))
				.sort((leftBranch, rightBranch) =>
					comparePokemonKeys(
						leftBranch.targetKey,
						rightBranch.targetKey,
						recordByKey,
					),
				);
			outgoingBranchesBySource.set(sourceKey, branches);
		}

		const countPathsFrom = (
			sourceKey: string,
			visitedKeys: Set<string>,
		): number => {
			const branches = (outgoingBranchesBySource.get(sourceKey) ?? []).filter(
				(branch) => !visitedKeys.has(branch.targetKey),
			);

			if (branches.length === 0) {
				return 1;
			}

			let totalPaths = 0;
			for (const branch of branches) {
				const nextVisitedKeys = new Set(visitedKeys);
				nextVisitedKeys.add(branch.targetKey);
				totalPaths += countPathsFrom(branch.targetKey, nextVisitedKeys);
				if (totalPaths >= MAX_EVOLUTION_PATH_COUNT) {
					return MAX_EVOLUTION_PATH_COUNT;
				}
			}

			return totalPaths;
		};

		let pathCount = 0;
		for (const rootKey of roots) {
			pathCount += countPathsFrom(rootKey, new Set([rootKey]));
			if (pathCount >= MAX_EVOLUTION_PATH_COUNT) {
				pathCount = MAX_EVOLUTION_PATH_COUNT;
				break;
			}
		}

		return {
			outgoingBranchesBySource,
			pathCount,
			recordByKey,
			rootKeys: roots,
			stageCount: componentKeys.size,
		};
	}, [pokemonRecords, selectedPokemon.key]);

	function renderPokemonCard(pokemon: PokemonRecord, keySuffix: string) {
		const isSelected = pokemon.key === selectedPokemon.key;
		const formattedId = formatPokemonId(pokemon.id);
		const typeLabel =
			pokemon.types.length > 0
				? pokemon.types.map((type) => toDisplayLabel(type)).join(" · ")
				: "Unknown";

		return (
			<button
				type="button"
				key={`evolution-card-${keySuffix}-${pokemon.key}`}
				onClick={() => onJumpToPokemon(pokemon.key)}
				className={`group flex flex-shrink-0 flex-col items-center rounded-xl border text-center transition hover:-translate-y-0.5 ${
					compact ? "w-[104px] px-2 py-2" : "w-[152px] px-3 py-3"
				} ${
					isSelected
						? "border-[rgba(50,143,151,0.55)] bg-[rgba(79,184,178,0.14)]"
						: "border-[var(--line)] bg-transparent"
				}`}
			>
				<PokemonSprite
					pokemon={pokemon}
					size={compact ? 60 : 110}
					className={`object-contain ${
						compact ? "h-[60px] w-[60px]" : "h-[110px] w-[110px]"
					}`}
				/>
				<p
					className={`mt-1 mb-0 font-semibold tabular-nums text-[var(--sea-ink-soft)] ${
						compact ? "text-[11px]" : "text-sm"
					}`}
				>
					#{formattedId ?? "???"}
				</p>
				<p
					className={`m-0 font-bold text-[var(--lagoon-deep)] ${
						compact ? "text-xs" : "text-lg"
					}`}
				>
					{pokemon.displayName}
				</p>
				<p
					className={`mt-1 mb-0 leading-tight text-[var(--sea-ink-soft)] ${
						compact ? "text-[10px]" : "text-xs"
					}`}
				>
					{typeLabel}
				</p>
			</button>
		);
	}

	function renderEvolutionArrow(
		branch: EvolutionBranch,
		keySuffix: string,
	) {
		const requirementLines = getEvolutionRequirementLines(branch.links);

		return (
			<div
				key={`evolution-arrow-${keySuffix}-${branch.targetKey}`}
				className={`flex flex-shrink-0 flex-col items-center justify-center gap-1 text-center ${
					compact ? "w-[76px]" : "w-[116px]"
				}`}
			>
				<span
					aria-hidden="true"
					className={`leading-none text-[var(--sea-ink-soft)] ${
						compact ? "text-xl" : "text-4xl"
					}`}
				>
					→
				</span>
				<div className="space-y-0.5">
					{requirementLines.map((line, index) => (
						<p
							key={`evolution-requirement-${keySuffix}-${branch.targetKey}-${index}`}
							className={`m-0 leading-tight font-semibold text-[var(--sea-ink-soft)] ${
								compact ? "text-[10px]" : "text-xs"
							}`}
						>
							{line}
						</p>
					))}
				</div>
			</div>
		);
	}

	function renderEvolutionNode(
		sourceKey: string,
		visitedKeys: Set<string>,
		keySuffix: string,
	): JSX.Element | null {
		const sourcePokemon = evolutionLayout.recordByKey.get(sourceKey);
		if (!sourcePokemon) {
			return null;
		}

		const branches = (evolutionLayout.outgoingBranchesBySource.get(sourceKey) ?? [])
			.filter((branch) => !visitedKeys.has(branch.targetKey));

		if (branches.length === 0) {
			return renderPokemonCard(sourcePokemon, `${keySuffix}-leaf`);
		}

		if (branches.length === 1) {
			const onlyBranch = branches[0];
			const nextVisitedKeys = new Set(visitedKeys);
			nextVisitedKeys.add(onlyBranch.targetKey);

			return (
				<div className={`flex items-start ${compact ? "gap-1.5" : "gap-3"}`}>
					<div className={`flex items-center ${compact ? "gap-1.5" : "gap-3"}`}>
						{renderPokemonCard(sourcePokemon, `${keySuffix}-single`)}
						{renderEvolutionArrow(onlyBranch, `${keySuffix}-single`)}
					</div>
					{renderEvolutionNode(
						onlyBranch.targetKey,
						nextVisitedKeys,
						`${keySuffix}-${onlyBranch.targetKey}`,
					)}
				</div>
			);
		}

		return (
			<div className={`flex items-start ${compact ? "gap-1.5" : "gap-3"}`}>
				{renderPokemonCard(sourcePokemon, `${keySuffix}-fork`)}
				<div className={`flex flex-col ${compact ? "gap-1.5" : "gap-2"}`}>
					{branches.map((branch, branchIndex) => {
						const nextVisitedKeys = new Set(visitedKeys);
						nextVisitedKeys.add(branch.targetKey);

						return (
							<div
								key={`evolution-branch-${keySuffix}-${branch.targetKey}-${branchIndex}`}
								className={`flex items-center ${compact ? "gap-1.5" : "gap-3"}`}
							>
								{renderEvolutionArrow(
									branch,
									`${keySuffix}-${branch.targetKey}-${branchIndex}`,
								)}
								{renderEvolutionNode(
									branch.targetKey,
									nextVisitedKeys,
									`${keySuffix}-${branch.targetKey}-${branchIndex}`,
								)}
							</div>
						);
					})}
				</div>
			</div>
		);
	}

	return (
		<section
			className={
				inline
					? "mt-6 border-t border-[var(--line)] pt-4"
					: "island-shell rounded-2xl p-5"
			}
		>
			<div className="mb-3 flex items-center justify-between gap-2">
				<h3
					className={`m-0 font-bold text-[var(--sea-ink)] ${
						compact ? "text-base" : "text-lg"
					}`}
				>
					Evolution Chart
				</h3>
				<span className="rounded-full border border-[var(--line)] px-2.5 py-0.5 text-xs font-semibold text-[var(--sea-ink-soft)]">
					{evolutionLayout.stageCount}{" "}
					{evolutionLayout.stageCount === 1 ? "stage" : "stages"} •{" "}
					{evolutionLayout.pathCount}{" "}
					{evolutionLayout.pathCount === 1 ? "path" : "paths"}
				</span>
			</div>

			<div className="space-y-2">
				{evolutionLayout.rootKeys.map((rootKey, rootIndex) => (
					<div
						key={`evolution-root-${rootKey}-${rootIndex}`}
						className="overflow-x-auto pb-1"
					>
						<div className="min-w-max">
							{renderEvolutionNode(
								rootKey,
								new Set([rootKey]),
								`root-${rootKey}-${rootIndex}`,
							)}
						</div>
					</div>
				))}
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
