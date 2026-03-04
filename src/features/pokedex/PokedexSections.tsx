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
	PokemonTypeMap,
} from "./types";
import {
	describeEvolutionRequirement,
	formatMultiplier,
	getDefenseMultiplierTone,
	getDefensiveMatchupLabel,
	getStatBarGradient,
	getTypeColor,
	getTypesForPokemon,
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
									size={22}
									className="h-[22px] w-[22px] rounded-full object-contain"
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
	pokemonTypes: PokemonTypeMap;
};

export function PokemonListTable({
	filteredPokemon,
	pokemonRecordsCount,
	pokemonTypes,
}: PokemonListTableProps) {
	const openPokemonInNewTab = (pokemonKey: string) => {
		if (typeof window === "undefined") {
			return;
		}

		const encodedPokemonKey = encodeURIComponent(pokemonKey.toLowerCase());
		window.open(`/pokemon/${encodedPokemonKey}`, "_blank", "noopener,noreferrer");
	};

	return (
		<section className="island-shell mt-7 rounded-2xl p-4 sm:p-5">
			<p className="text-xs font-semibold tracking-[0.12em] text-[var(--sea-ink-soft)] uppercase">
				{filteredPokemon.length} shown / {pokemonRecordsCount} total
			</p>

			<div className="mt-3 overflow-auto rounded-xl border border-[var(--line)]">
				<table className="w-full min-w-[960px] border-collapse text-sm">
					<thead className="sticky top-0 bg-[color-mix(in_oklab,var(--surface-strong)_86%,white_14%)]">
						<tr>
							<th className="px-3 py-2 text-left text-xs font-bold tracking-[0.1em] text-[var(--sea-ink-soft)] uppercase">
								Pokemon
							</th>
							<th className="px-3 py-2 text-left text-xs font-bold tracking-[0.1em] text-[var(--sea-ink-soft)] uppercase">
								Types
							</th>
							<th className="px-3 py-2 text-left text-xs font-bold tracking-[0.1em] text-[var(--sea-ink-soft)] uppercase">
								BST
							</th>
							<th className="px-3 py-2 text-left text-xs font-bold tracking-[0.1em] text-[var(--sea-ink-soft)] uppercase">
								Base Stats
							</th>
							<th className="px-3 py-2 text-left text-xs font-bold tracking-[0.1em] text-[var(--sea-ink-soft)] uppercase">
								Learnset
							</th>
							<th className="px-3 py-2 text-left text-xs font-bold tracking-[0.1em] text-[var(--sea-ink-soft)] uppercase">
								Evolutions
							</th>
						</tr>
					</thead>
					<tbody>
						{filteredPokemon.length > 0 ? (
							filteredPokemon.map((pokemon) => {
								const rowTypes = getTypesForPokemon(pokemon, pokemonTypes);

								return (
									<tr
										key={`list-row-${pokemon.key}`}
										tabIndex={0}
										role="link"
										onClick={() => openPokemonInNewTab(pokemon.key)}
										onKeyDown={(event) => {
											if (event.key === "Enter" || event.key === " ") {
												event.preventDefault();
												openPokemonInNewTab(pokemon.key);
											}
										}}
										className="cursor-pointer transition-colors hover:bg-[rgba(79,184,178,0.08)] focus-visible:outline-2 focus-visible:outline-[var(--lagoon-deep)] focus-visible:outline-offset-[-2px]"
									>
										<td className="border-t border-[var(--line)] px-3 py-2.5">
											<div className="flex items-center gap-2.5">
												<PokemonSprite
													pokemon={pokemon}
													size={44}
													className="h-11 w-11 flex-shrink-0 rounded-xl border border-[var(--line)] bg-[rgba(255,255,255,0.5)] object-contain p-1"
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
													<span className="text-xs text-[var(--sea-ink-soft)]">
														Unknown
													</span>
												)}
											</div>
										</td>
										<td className="border-t border-[var(--line)] px-3 py-2.5 font-bold tabular-nums text-[var(--sea-ink)]">
											{pokemon.total}
										</td>
										<td className="border-t border-[var(--line)] px-3 py-2.5">
											<div className="grid min-w-[360px] grid-cols-3 gap-1.5">
												{STAT_ROWS.map((row) => {
													const value =
														pokemon.baseStats[row.key] ?? EMPTY_STATS[row.key];
													const width = Math.min(100, (value / STAT_CAP) * 100);

													return (
														<div
															key={`list-stat-${pokemon.key}-${row.key}`}
															className="rounded-lg border border-[var(--line)] bg-transparent px-2 py-1"
														>
															<div className="flex items-center justify-between gap-1">
																<span className="text-[10px] font-bold tracking-[0.08em] text-[var(--sea-ink-soft)] uppercase">
																	{STAT_LIST_LABELS[row.key]}
																</span>
																<span className="text-[10px] font-semibold tabular-nums text-[var(--sea-ink)]">
																	{value}
																</span>
															</div>
															<div className="mt-1 h-1.5 rounded-full bg-[rgba(17,44,49,0.12)]">
																<div
																	className="h-full rounded-full"
																	style={{
																		width: `${width}%`,
																		backgroundImage: getStatBarGradient(value),
																	}}
																/>
															</div>
														</div>
													);
												})}
											</div>
										</td>
										<td className="border-t border-[var(--line)] px-3 py-2.5 text-xs font-semibold tabular-nums text-[var(--sea-ink-soft)]">
											{pokemon.learnSet.length}
										</td>
										<td className="border-t border-[var(--line)] px-3 py-2.5 text-xs font-semibold tabular-nums text-[var(--sea-ink-soft)]">
											{pokemon.evolutionTable.length}
										</td>
									</tr>
								);
							})
						) : (
							<tr>
								<td
									colSpan={6}
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
	hasLoadedTypes: boolean;
	selectedPokemon: PokemonRecord;
	selectedPokemonTypes: string[];
	typeLoadError: string | null;
};

export function PokemonSummaryCard({
	hasLoadedTypes,
	selectedPokemon,
	selectedPokemonTypes,
	typeLoadError,
}: PokemonSummaryCardProps) {
	return (
		<article className="island-shell rise-in rounded-2xl p-5 sm:p-6">
			<div className="flex flex-wrap items-start justify-between gap-3">
				<div className="flex items-start gap-4">
					<a
						href={`https://pokemondb.net/pokedex/${selectedPokemon.baseSlug}`}
						target="_blank"
						rel="noreferrer"
						className="group inline-flex rounded-2xl border border-[var(--line)] bg-[rgba(255,255,255,0.5)] p-2 transition hover:-translate-y-0.5 hover:border-[rgba(50,143,151,0.45)]"
						title={`Open ${selectedPokemon.displayName} on PokemonDB`}
					>
						<PokemonSprite
							pokemon={selectedPokemon}
							size={104}
							className="h-[104px] w-[104px] rounded-xl object-contain"
						/>
					</a>
					<div>
						<h2 className="display-title m-0 text-3xl font-bold tracking-tight sm:text-4xl">
							{selectedPokemon.displayName}
						</h2>
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
							{hasLoadedTypes &&
							!typeLoadError &&
							selectedPokemonTypes.length === 0 ? (
								<span className="rounded-full border border-[var(--line)] bg-[rgba(255,255,255,0.5)] px-2.5 py-1 text-[11px] font-semibold text-[var(--sea-ink-soft)]">
									Type unknown
								</span>
							) : null}
						</div>
						{!hasLoadedTypes ? (
							<p className="mt-1 mb-0 text-xs text-[var(--sea-ink-soft)]">
								Loading type data from PokemonDB...
							</p>
						) : null}
            {typeLoadError ? (
              <p className="mt-1 mb-0 text-xs text-amber-700 dark:text-amber-300">
                Type data unavailable: {typeLoadError}
              </p>
            ) : null}
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
	hasLoadedTypes: boolean;
	selectedDefensiveMultipliers: DefenseMultiplierMap | null;
	selectedPokemonName: string;
	selectedPokemonTypes: string[];
	typeLoadError: string | null;
};

export function TypeDefensesCard({
	hasLoadedTypes,
	selectedDefensiveMultipliers,
	selectedPokemonName,
	selectedPokemonTypes,
	typeLoadError,
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
					{!hasLoadedTypes
						? "Loading type matchup data from PokemonDB..."
						: typeLoadError
							? "Type matchup card unavailable until type data loads."
							: "Type matchup card unavailable for this Pokemon."}
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
