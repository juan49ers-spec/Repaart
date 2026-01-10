/**
 * ENCYCLOPEDIA INTEGRITY CHECKER
 * Script para validar integridad de datos de la Encyclopedia
 * 
 * Verifica:
 * - Referencias válidas entre categorías, módulos y quizzes
 * - Duplicados
 * - Orden secuencial
 * - Distribución de contenido
 * - Estructura de datos
 */

import { ENCYCLOPEDIA_SEED_DATA } from '../src/data/encyclopediaSeed.js';

const COLORS = {
    RED: '\x1b[31m',
    GREEN: '\x1b[32m',
    YELLOW: '\x1b[33m',
    BLUE: '\x1b[36m',
    RESET: '\x1b[0m',
    BOLD: '\x1b[1m'
};

class EncyclopediaValidator {
    constructor(data) {
        this.data = data;
        this.errors = [];
        this.warnings = [];
        this.stats = {};
    }

    log(message, color = COLORS.RESET) {
        console.log(`${color}${message}${COLORS.RESET}`);
    }

    addError(message) {
        this.errors.push(message);
        this.log(`❌ ERROR: ${message}`, COLORS.RED);
    }

    addWarning(message) {
        this.warnings.push(message);
        this.log(`⚠️  WARNING: ${message}`, COLORS.YELLOW);
    }

    addSuccess(message) {
        this.log(`✅ ${message}`, COLORS.GREEN);
    }

    // Test 1: Validate Categories
    validateCategories() {
        this.log('\n📁 === VALIDATING CATEGORIES ===', COLORS.BOLD + COLORS.BLUE);

        const categories = this.data.categories;
        const categoryIds = new Set();
        const categoryNames = new Set();
        const orders = new Set();

        categories.forEach((cat, idx) => {
            // Check required fields
            if (!cat.id) this.addError(`Category at index ${idx} missing 'id'`);
            if (!cat.name) this.addError(`Category '${cat.id}' missing 'name'`);
            if (!cat.color) this.addWarning(`Category '${cat.id}' missing 'color'`);
            if (cat.order === undefined) this.addError(`Category '${cat.id}' missing 'order'`);

            // Check duplicates
            if (categoryIds.has(cat.id)) {
                this.addError(`Duplicate category ID: '${cat.id}'`);
            }
            categoryIds.add(cat.id);

            if (categoryNames.has(cat.name)) {
                this.addWarning(`Duplicate category name: '${cat.name}'`);
            }
            categoryNames.add(cat.name);

            if (orders.has(cat.order)) {
                this.addError(`Duplicate order ${cat.order} in categories`);
            }
            orders.add(cat.order);
        });

        // Check order sequence
        const sortedOrders = Array.from(orders).sort((a, b) => a - b);
        const expectedOrders = Array.from({ length: sortedOrders.length }, (_, i) => i + 1);
        const hasGaps = !sortedOrders.every((order, idx) => order === expectedOrders[idx]);

        if (hasGaps) {
            this.addWarning(`Category orders have gaps: ${sortedOrders.join(', ')}`);
        } else {
            this.addSuccess(`Category orders are sequential (1-${categories.length})`);
        }

        this.addSuccess(`Validated ${categories.length} categories`);
        return categoryIds;
    }

    // Test 2: Validate Modules
    validateModules(categoryIds) {
        this.log('\n📚 === VALIDATING MODULES ===', COLORS.BOLD + COLORS.BLUE);

        const modules = this.data.modules;
        const moduleTitles = new Set();
        const orphanModules = [];
        const categoryModuleCounts = {};

        modules.forEach((mod, idx) => {
            // Check required fields
            if (!mod.title) this.addError(`Module at index ${idx} missing 'title'`);
            if (!mod.content) this.addWarning(`Module '${mod.title}' missing 'content'`);
            if (!mod.action) this.addWarning(`Module '${mod.title}' missing 'action'`);
            if (!mod.categoryId) {
                this.addError(`Module '${mod.title}' missing 'categoryId'`);
            } else {
                // Check if categoryId exists
                if (!categoryIds.has(mod.categoryId)) {
                    this.addError(`Module '${mod.title}' references non-existent category '${mod.categoryId}'`);
                    orphanModules.push(mod.title);
                }

                // Count modules per category
                categoryModuleCounts[mod.categoryId] = (categoryModuleCounts[mod.categoryId] || 0) + 1;
            }

            // Check duplicates
            if (moduleTitles.has(mod.title)) {
                this.addWarning(`Duplicate module title: '${mod.title}'`);
            }
            moduleTitles.add(mod.title);

            // Check order
            if (mod.order === undefined) {
                this.addWarning(`Module '${mod.title}' missing 'order'`);
            }
        });

        // Report orphans
        if (orphanModules.length > 0) {
            this.addError(`Found ${orphanModules.length} orphan modules (invalid categoryId)`);
        }

        // Report distribution
        this.log('\n📊 Modules per category:', COLORS.BLUE);
        const categoriesArray = this.data.categories;
        categoriesArray.forEach(cat => {
            const count = categoryModuleCounts[cat.id] || 0;
            const color = count === 0 ? COLORS.RED : count < 5 ? COLORS.YELLOW : COLORS.GREEN;
            this.log(`   ${cat.name}: ${count} modules`, color);
        });

        this.addSuccess(`Validated ${modules.length} modules`);
        return categoryModuleCounts;
    }

    // Test 3: Validate Quizzes
    validateQuizzes(categoryIds) {
        this.log('\n🎯 === VALIDATING QUIZZES ===', COLORS.BOLD + COLORS.BLUE);

        const quizzes = this.data.quizzes;
        const quizQuestions = new Set();
        const categoryQuizCounts = {};

        quizzes.forEach((quiz, idx) => {
            // Check required fields
            if (!quiz.question) this.addError(`Quiz at index ${idx} missing 'question'`);
            if (!quiz.options || !Array.isArray(quiz.options)) {
                this.addError(`Quiz '${quiz.question}' missing valid 'options' array`);
            } else {
                if (quiz.options.length !== 4) {
                    this.addWarning(`Quiz '${quiz.question}' has ${quiz.options.length} options (expected 4)`);
                }
                // Check for empty options
                quiz.options.forEach((opt, i) => {
                    if (!opt || opt.trim() === '') {
                        this.addError(`Quiz '${quiz.question}' has empty option at index ${i}`);
                    }
                });
            }

            if (quiz.correctIndex === undefined) {
                this.addError(`Quiz '${quiz.question}' missing 'correctIndex'`);
            } else if (quiz.correctIndex < 0 || quiz.correctIndex > 3) {
                this.addError(`Quiz '${quiz.question}' has invalid correctIndex: ${quiz.correctIndex}`);
            }

            if (!quiz.categoryId) {
                this.addError(`Quiz '${quiz.question}' missing 'categoryId'`);
            } else {
                if (!categoryIds.has(quiz.categoryId)) {
                    this.addError(`Quiz '${quiz.question}' references non-existent category '${quiz.categoryId}'`);
                }
                categoryQuizCounts[quiz.categoryId] = (categoryQuizCounts[quiz.categoryId] || 0) + 1;
            }

            // Check duplicates
            if (quizQuestions.has(quiz.question)) {
                this.addWarning(`Duplicate quiz question: '${quiz.question}'`);
            }
            quizQuestions.add(quiz.question);
        });

        // Report distribution
        this.log('\n📊 Quizzes per category:', COLORS.BLUE);
        const categoriesArray = this.data.categories;
        categoriesArray.forEach(cat => {
            const count = categoryQuizCounts[cat.id] || 0;
            const color = count === 0 ? COLORS.RED : count < 3 ? COLORS.YELLOW : COLORS.GREEN;
            this.log(`   ${cat.name}: ${count} quizzes`, color);
        });

        this.addSuccess(`Validated ${quizzes.length} quizzes`);
        return categoryQuizCounts;
    }

    // Test 4: Check Content Balance
    validateBalance(categoryModuleCounts, categoryQuizCounts) {
        this.log('\n⚖️  === CHECKING CONTENT BALANCE ===', COLORS.BOLD + COLORS.BLUE);

        const categoriesArray = this.data.categories;
        const imbalanced = [];

        categoriesArray.forEach(cat => {
            const moduleCount = categoryModuleCounts[cat.id] || 0;
            const quizCount = categoryQuizCounts[cat.id] || 0;

            // Recommended: at least 8 modules and 8 quizzes per category
            if (moduleCount < 8) {
                imbalanced.push(`${cat.name}: only ${moduleCount} modules (recommended: 8+)`);
            }
            if (quizCount < 8) {
                imbalanced.push(`${cat.name}: only ${quizCount} quizzes (recommended: 8+)`);
            }
        });

        if (imbalanced.length > 0) {
            this.addWarning(`Found ${imbalanced.length} imbalanced categories:`);
            imbalanced.forEach(msg => this.log(`   - ${msg}`, COLORS.YELLOW));
        } else {
            this.addSuccess('All categories have balanced content (8+ modules and quizzes each)');
        }
    }

    // Test 5: Statistics
    generateStats() {
        this.log('\n📈 === STATISTICS ===', COLORS.BOLD + COLORS.BLUE);

        const stats = {
            totalCategories: this.data.categories.length,
            totalModules: this.data.modules.length,
            totalQuizzes: this.data.quizzes.length,
            avgModulesPerCategory: (this.data.modules.length / this.data.categories.length).toFixed(2),
            avgQuizzesPerCategory: (this.data.quizzes.length / this.data.categories.length).toFixed(2)
        };

        this.log(`   Total Categories: ${stats.totalCategories}`, COLORS.GREEN);
        this.log(`   Total Modules: ${stats.totalModules}`, COLORS.GREEN);
        this.log(`   Total Quizzes: ${stats.totalQuizzes}`, COLORS.GREEN);
        this.log(`   Avg Modules/Category: ${stats.avgModulesPerCategory}`, COLORS.BLUE);
        this.log(`   Avg Quizzes/Category: ${stats.avgQuizzesPerCategory}`, COLORS.BLUE);

        this.stats = stats;
    }

    // Run all tests
    runAllTests() {
        this.log('\n' + '='.repeat(60), COLORS.BOLD);
        this.log('🔍 ENCYCLOPEDIA INTEGRITY CHECK', COLORS.BOLD + COLORS.BLUE);
        this.log('='.repeat(60), COLORS.BOLD);

        const categoryIds = this.validateCategories();
        const moduleDistribution = this.validateModules(categoryIds);
        const quizDistribution = this.validateQuizzes(categoryIds);
        this.validateBalance(moduleDistribution, quizDistribution);
        this.generateStats();

        // Final Report
        this.log('\n' + '='.repeat(60), COLORS.BOLD);
        this.log('📋 FINAL REPORT', COLORS.BOLD + COLORS.BLUE);
        this.log('='.repeat(60), COLORS.BOLD);

        if (this.errors.length === 0 && this.warnings.length === 0) {
            this.log('\n🎉 PERFECT! No errors or warnings found!', COLORS.BOLD + COLORS.GREEN);
        } else {
            if (this.errors.length > 0) {
                this.log(`\n❌ Found ${this.errors.length} error(s)`, COLORS.RED);
            }
            if (this.warnings.length > 0) {
                this.log(`⚠️  Found ${this.warnings.length} warning(s)`, COLORS.YELLOW);
            }
        }

        this.log('='.repeat(60) + '\n', COLORS.BOLD);

        return {
            errors: this.errors,
            warnings: this.warnings,
            stats: this.stats,
            success: this.errors.length === 0
        };
    }
}

// Run the validator
console.log('\n');
const validator = new EncyclopediaValidator(ENCYCLOPEDIA_SEED_DATA);
const result = validator.runAllTests();

// Exit with appropriate code
process.exit(result.success ? 0 : 1);
