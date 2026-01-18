import { migrationService } from './src/services/migrationService';

(async () => {
    console.log("--- starting full migration ---");

    console.log("--- starting finance migration ---");
    const financeRes = await migrationService.migrateFinanceLegacyFields(false);
    console.log("finance migration result:", financeRes);

    console.log("--- starting fleet migration ---");
    const fleetRes = await migrationService.migrateFleetLegacyFields(false);
    console.log("fleet migration result:", fleetRes);

    console.log("--- starting user migration ---");
    const userRes = await migrationService.migrateUserLegacyFields(false);
    console.log("user migration result:", userRes);

    console.log("--- starting franchise migration ---");
    const franchiseRes = await migrationService.migrateFranchiseLegacyFields(false);
    console.log("franchise migration result:", franchiseRes);

    console.log("--- all migrations complete ---");
})();
