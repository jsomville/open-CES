import "dotenv/config";
import { performance } from "node:perf_hooks";
import { prisma } from "./utils/prisma.ts";

type BenchStats = {
    samplesMs: number[];
    avgMs: number;
    minMs: number;
    maxMs: number;
    p50Ms: number;
    p95Ms: number;
};

type ExplainRow = {
    "QUERY PLAN": string;
};

function asNumber(envName: string, fallback: number): number {
    const raw = process.env[envName];
    if (!raw) return fallback;
    const parsed = Number.parseInt(raw, 10);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function percentile(sortedValues: number[], p: number): number {
    if (sortedValues.length === 0) return 0;
    const idx = Math.ceil((p / 100) * sortedValues.length) - 1;
    return sortedValues[Math.max(0, Math.min(sortedValues.length - 1, idx))];
}

function computeStats(samplesMs: number[]): BenchStats {
    const sorted = [...samplesMs].sort((a, b) => a - b);
    const sum = samplesMs.reduce((acc, value) => acc + value, 0);
    return {
        samplesMs,
        avgMs: sum / samplesMs.length,
        minMs: sorted[0] ?? 0,
        maxMs: sorted[sorted.length - 1] ?? 0,
        p50Ms: percentile(sorted, 50),
        p95Ms: percentile(sorted, 95),
    };
}

async function runBenchmark(
    label: string,
    iterations: number,
    warmup: number,
    work: () => Promise<unknown>,
): Promise<BenchStats> {
    for (let i = 0; i < warmup; i += 1) {
        await work();
    }

    const samplesMs: number[] = [];
    for (let i = 0; i < iterations; i += 1) {
        const t0 = performance.now();
        await work();
        const t1 = performance.now();
        samplesMs.push(t1 - t0);
    }

    const stats = computeStats(samplesMs);
    console.log(
        `${label.padEnd(30)} avg=${stats.avgMs.toFixed(3)}ms ` +
            `p50=${stats.p50Ms.toFixed(3)}ms p95=${stats.p95Ms.toFixed(3)}ms ` +
            `min=${stats.minMs.toFixed(3)}ms max=${stats.maxMs.toFixed(3)}ms`,
    );
    return stats;
}

async function main(): Promise<void> {
    const iterations = asNumber("BENCH_ITERATIONS", 120);
    const warmup = asNumber("BENCH_WARMUP", 20);
    const limit = asNumber("BENCH_LIMIT", 100);
    const benchmarkLabel = process.env.BENCH_LABEL ?? "baseline";
    const cutoffDays = asNumber("BENCH_CUTOFF_DAYS", 180);

    const totalUsers = await prisma.user.count();
    if (totalUsers === 0) {
        console.log("No users found. Seed users before running this benchmark.");
        return;
    }

    const anchorUser = await prisma.user.findFirst({
        select: { status: true, isActive: true },
        orderBy: { id: "asc" },
    });

    if (!anchorUser) {
        console.log("No user sample found. Aborting benchmark.");
        return;
    }

    const cutoffDate = new Date(Date.now() - cutoffDays * 24 * 60 * 60 * 1000);

    console.log("\\nUser table benchmark");
    console.log("--------------------");
    console.log(`Label:          ${benchmarkLabel}`);
    console.log(`Users:          ${totalUsers}`);
    console.log(`Iterations:     ${iterations}`);
    console.log(`Warmup:         ${warmup}`);
    console.log(`Page size:      ${limit}`);
    console.log(`Filter status:  ${anchorUser.status}`);
    console.log(`Filter active:  ${anchorUser.isActive}`);
    console.log(`Cutoff days:    ${cutoffDays}`);

    console.log("\\nQuery timings");
    console.log("-------------");

    const q1 = await runBenchmark(
        "Q1 status+active+orderBy",
        iterations,
        warmup,
        async () => {
            await prisma.user.findMany({
                where: { status: anchorUser.status, isActive: anchorUser.isActive },
                orderBy: { lastLoginAt: "desc" },
                take: limit,
                select: { id: true, lastLoginAt: true, status: true, isActive: true },
            });
        },
    );

    const q2 = await runBenchmark(
        "Q2 status+recentLogins",
        iterations,
        warmup,
        async () => {
            await prisma.user.findMany({
                where: {
                    status: anchorUser.status,
                    lastLoginAt: { gte: cutoffDate },
                },
                orderBy: { lastLoginAt: "desc" },
                take: limit,
                select: { id: true, lastLoginAt: true },
            });
        },
    );

    const q3 = await runBenchmark(
        "Q3 count status+active",
        iterations,
        warmup,
        async () => {
            await prisma.user.count({
                where: { status: anchorUser.status, isActive: anchorUser.isActive },
            });
        },
    );

    // EXPLAIN ANALYZE output gives objective evidence (scan type, buffers, timings).
    const explain = await prisma.$queryRaw<ExplainRow[]>`
        EXPLAIN (ANALYZE, BUFFERS, FORMAT TEXT)
        SELECT id, status, is_active, last_login_at
        FROM "User"
        WHERE status = ${anchorUser.status}
            AND is_active = ${anchorUser.isActive}
        ORDER BY last_login_at DESC NULLS LAST
        LIMIT ${limit}
    `;

    console.log("\\nEXPLAIN ANALYZE (Q1 equivalent)");
    console.log("------------------------------");
    for (const row of explain) {
        console.log(row["QUERY PLAN"]);
    }

    console.log("\\nSummary (copy these numbers before/after indexes)");
    console.log("-----------------------------------------------");
    console.log(
        JSON.stringify(
            {
                label: benchmarkLabel,
                users: totalUsers,
                iterations,
                warmup,
                limit,
                filters: {
                    status: anchorUser.status,
                    isActive: anchorUser.isActive,
                    cutoffDays,
                },
                results: {
                    q1: { avgMs: q1.avgMs, p50Ms: q1.p50Ms, p95Ms: q1.p95Ms },
                    q2: { avgMs: q2.avgMs, p50Ms: q2.p50Ms, p95Ms: q2.p95Ms },
                    q3: { avgMs: q3.avgMs, p50Ms: q3.p50Ms, p95Ms: q3.p95Ms },
                },
            },
            null,
            2,
        ),
    );
}

if (import.meta.url === `file://${process.argv[1]}`) {
    main()
        .catch((error) => {
            console.error("Benchmark failed:", error);
            process.exitCode = 1;
        })
        .finally(async () => {
            await prisma.$disconnect();
        });
}