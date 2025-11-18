#!/usr/bin/env ts-node
/**
 * Integration Validation Script
 *
 * Validates all integration requirements for Sprint 2 deployment
 *
 * Usage:
 *   npm run validate:integration
 *   ts-node scripts/validate-integration.ts
 *   ts-node scripts/validate-integration.ts --fix
 *
 * Exit codes:
 *   0: All validations passed
 *   1: Validation failures detected
 *   2: Script error
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

// ANSI color codes
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

interface ValidationResult {
  name: string;
  passed: boolean;
  message: string;
  critical: boolean;
  fixable?: boolean;
}

interface Requirements {
  environment: any;
  dependencies: any;
  services: any;
  database: any;
  storage: any;
  environmentVariables: any;
  features: any;
  performance: any;
  testing: any;
  security: any;
}

class IntegrationValidator {
  private requirements: Requirements;
  private results: ValidationResult[] = [];
  private shouldFix: boolean;

  constructor() {
    // Load requirements
    const requirementsPath = path.join(process.cwd(), 'config', 'integration-requirements.json');
    this.requirements = JSON.parse(fs.readFileSync(requirementsPath, 'utf-8'));
    this.shouldFix = process.argv.includes('--fix');
  }

  // Utility: Run command and return output
  private exec(command: string, ignoreError = false): string {
    try {
      return execSync(command, { encoding: 'utf-8' }).trim();
    } catch (error) {
      if (!ignoreError) throw error;
      return '';
    }
  }

  // Utility: Check if file exists
  private fileExists(filePath: string): boolean {
    return fs.existsSync(path.join(process.cwd(), filePath));
  }

  // Utility: Add validation result
  private addResult(name: string, passed: boolean, message: string, critical = false, fixable = false): void {
    this.results.push({ name, passed, message, critical, fixable });
  }

  // Validation: Node.js version
  private validateNodeVersion(): void {
    const nodeVersion = process.version.replace('v', '');
    const minVersion = this.requirements.environment.node.minimum;
    const passed = this.compareVersions(nodeVersion, minVersion) >= 0;

    this.addResult(
      'Node.js Version',
      passed,
      passed
        ? `Node.js ${nodeVersion} meets minimum ${minVersion}`
        : `Node.js ${nodeVersion} is below minimum ${minVersion}`,
      true
    );
  }

  // Validation: npm version
  private validateNpmVersion(): void {
    const npmVersion = this.exec('npm --version');
    const minVersion = this.requirements.environment.npm.minimum;
    const passed = this.compareVersions(npmVersion, minVersion) >= 0;

    this.addResult(
      'npm Version',
      passed,
      passed
        ? `npm ${npmVersion} meets minimum ${minVersion}`
        : `npm ${npmVersion} is below minimum ${minVersion}`,
      true
    );
  }

  // Validation: Production dependencies
  private validateDependencies(): void {
    const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf-8'));
    const required = this.requirements.dependencies.production;
    let missing: string[] = [];

    for (const [pkg, version] of Object.entries(required)) {
      if (!packageJson.dependencies?.[pkg] && !packageJson.devDependencies?.[pkg]) {
        missing.push(pkg);
      }
    }

    const passed = missing.length === 0;
    this.addResult(
      'Production Dependencies',
      passed,
      passed
        ? 'All required dependencies present'
        : `Missing dependencies: ${missing.join(', ')}`,
      true,
      true
    );

    if (!passed && this.shouldFix) {
      console.log(`${colors.yellow}Installing missing dependencies...${colors.reset}`);
      this.exec(`npm install ${missing.join(' ')} --save`);
    }
  }

  // Validation: Environment variables
  private validateEnvironmentVariables(): void {
    const envExample = this.fileExists('.env.example');
    const envLocal = this.fileExists('.env.local');

    if (!envExample) {
      this.addResult('Environment Files', false, '.env.example not found', true);
      return;
    }

    const required = this.requirements.environmentVariables.required;
    const missing: string[] = [];

    // Check .env.local
    if (envLocal) {
      const envContent = fs.readFileSync('.env.local', 'utf-8');
      for (const varName of required) {
        if (!envContent.includes(varName)) {
          missing.push(varName);
        }
      }
    }

    const passed = envLocal && missing.length === 0;
    this.addResult(
      'Environment Variables',
      passed,
      passed
        ? 'All required environment variables set'
        : `.env.local ${!envLocal ? 'not found' : `missing: ${missing.join(', ')}`}`,
      true,
      true
    );

    if (!passed && this.shouldFix && !envLocal) {
      console.log(`${colors.yellow}Creating .env.local from .env.example...${colors.reset}`);
      fs.copyFileSync('.env.example', '.env.local');
    }
  }

  // Validation: Database migrations
  private validateDatabaseMigrations(): void {
    const migrations = this.requirements.database.migrations;
    let allExist = true;

    for (const migration of migrations) {
      if (!this.fileExists(migration.file)) {
        allExist = false;
        this.addResult(
          `Migration ${migration.id}`,
          false,
          `Migration file ${migration.file} not found`,
          migration.required
        );
      }
    }

    if (allExist) {
      this.addResult(
        'Database Migrations',
        true,
        `All ${migrations.length} migration files present`,
        false
      );
    }
  }

  // Validation: Required source files
  private validateSourceFiles(): void {
    const features = this.requirements.features;
    let missing: string[] = [];

    for (const [featureId, feature] of Object.entries<any>(features)) {
      for (const file of feature.requiredFiles) {
        if (!this.fileExists(file)) {
          missing.push(`${featureId}: ${file}`);
        }
      }
    }

    const passed = missing.length === 0;
    this.addResult(
      'Source Files',
      passed,
      passed
        ? 'All required source files present'
        : `Missing files: ${missing.join(', ')}`,
      true
    );
  }

  // Validation: Test files
  private validateTestFiles(): void {
    const features = this.requirements.features;
    let missing: string[] = [];

    for (const [featureId, feature] of Object.entries<any>(features)) {
      if (feature.tests && !this.fileExists(feature.tests)) {
        missing.push(`${featureId}: ${feature.tests}`);
      }
    }

    const passed = missing.length === 0;
    this.addResult(
      'Test Files',
      passed,
      passed
        ? 'All test files present'
        : `Missing test files: ${missing.join(', ')}`,
      false
    );
  }

  // Validation: TypeScript compilation
  private validateTypeScript(): void {
    try {
      this.exec('npm run typecheck');
      this.addResult('TypeScript Compilation', true, 'No type errors', true);
    } catch (error) {
      this.addResult('TypeScript Compilation', false, 'Type errors detected', true, true);

      if (this.shouldFix) {
        console.log(`${colors.yellow}TypeScript errors cannot be auto-fixed. Please review manually.${colors.reset}`);
      }
    }
  }

  // Validation: ESLint
  private validateLinting(): void {
    try {
      this.exec('npm run lint');
      this.addResult('ESLint', true, 'No linting errors', false);
    } catch (error) {
      this.addResult('ESLint', false, 'Linting errors detected', false, true);

      if (this.shouldFix) {
        console.log(`${colors.yellow}Running ESLint --fix...${colors.reset}`);
        try {
          this.exec('npm run lint -- --fix');
          console.log(`${colors.green}ESLint errors fixed${colors.reset}`);
        } catch (fixError) {
          console.log(`${colors.red}Some ESLint errors require manual fixes${colors.reset}`);
        }
      }
    }
  }

  // Validation: Unit tests
  private validateUnitTests(): void {
    try {
      const output = this.exec('npm run test -- --reporter=json', true);
      const result = JSON.parse(output);
      const passed = result.numFailedTests === 0;
      const expectedTests = this.requirements.testing.unit.expectedTests;
      const actualTests = result.numTotalTests;

      this.addResult(
        'Unit Tests',
        passed && actualTests >= expectedTests,
        passed
          ? `${actualTests} tests passing (expected: ${expectedTests})`
          : `${result.numFailedTests} test failures`,
        true
      );
    } catch (error) {
      this.addResult('Unit Tests', false, 'Failed to run unit tests', true);
    }
  }

  // Validation: Build
  private validateBuild(): void {
    try {
      console.log(`${colors.cyan}Running production build...${colors.reset}`);
      this.exec('npm run build');

      // Check bundle size
      const statsPath = '.next/analyze/client.json';
      if (this.fileExists(statsPath)) {
        const stats = JSON.parse(fs.readFileSync(statsPath, 'utf-8'));
        const totalSize = stats.assets.reduce((sum: number, asset: any) => sum + asset.size, 0);
        const maxSize = 500 * 1024; // 500KB

        if (totalSize <= maxSize) {
          this.addResult('Build Size', true, `Bundle size ${(totalSize / 1024).toFixed(2)}KB (limit: 500KB)`, false);
        } else {
          this.addResult('Build Size', false, `Bundle size ${(totalSize / 1024).toFixed(2)}KB exceeds 500KB limit`, false);
        }
      }

      this.addResult('Production Build', true, 'Build successful', true);
    } catch (error) {
      this.addResult('Production Build', false, 'Build failed', true);
    }
  }

  // Validation: Security audit
  private validateSecurity(): void {
    try {
      const output = this.exec('npm audit --json', true);
      const audit = JSON.parse(output);

      const critical = audit.metadata?.vulnerabilities?.critical || 0;
      const high = audit.metadata?.vulnerabilities?.high || 0;

      const passed = critical === 0 && high === 0;

      this.addResult(
        'Security Audit',
        passed,
        passed
          ? 'No critical or high vulnerabilities'
          : `${critical} critical, ${high} high vulnerabilities`,
        true,
        true
      );

      if (!passed && this.shouldFix) {
        console.log(`${colors.yellow}Attempting to fix vulnerabilities...${colors.reset}`);
        this.exec('npm audit fix');
      }
    } catch (error) {
      this.addResult('Security Audit', false, 'Failed to run security audit', true);
    }
  }

  // Utility: Compare semantic versions
  private compareVersions(v1: string, v2: string): number {
    const parts1 = v1.split('.').map(Number);
    const parts2 = v2.split('.').map(Number);

    for (let i = 0; i < 3; i++) {
      if (parts1[i] > parts2[i]) return 1;
      if (parts1[i] < parts2[i]) return -1;
    }
    return 0;
  }

  // Print results
  private printResults(): void {
    console.log(`\n${colors.bright}${colors.blue}Integration Validation Results${colors.reset}\n`);
    console.log('='.repeat(80));

    const passed = this.results.filter(r => r.passed).length;
    const failed = this.results.filter(r => !r.passed).length;
    const critical = this.results.filter(r => !r.passed && r.critical).length;

    // Group results by status
    const criticalFailures = this.results.filter(r => !r.passed && r.critical);
    const nonCriticalFailures = this.results.filter(r => !r.passed && !r.critical);
    const successes = this.results.filter(r => r.passed);

    // Print critical failures first
    if (criticalFailures.length > 0) {
      console.log(`\n${colors.red}${colors.bright}Critical Failures:${colors.reset}`);
      for (const result of criticalFailures) {
        console.log(`  ${colors.red}✗${colors.reset} ${result.name}`);
        console.log(`    ${result.message}`);
        if (result.fixable) {
          console.log(`    ${colors.yellow}💡 Fixable with --fix flag${colors.reset}`);
        }
      }
    }

    // Print non-critical failures
    if (nonCriticalFailures.length > 0) {
      console.log(`\n${colors.yellow}${colors.bright}Non-Critical Failures:${colors.reset}`);
      for (const result of nonCriticalFailures) {
        console.log(`  ${colors.yellow}⚠${colors.reset} ${result.name}`);
        console.log(`    ${result.message}`);
        if (result.fixable) {
          console.log(`    ${colors.yellow}💡 Fixable with --fix flag${colors.reset}`);
        }
      }
    }

    // Print successes (collapsed)
    if (successes.length > 0) {
      console.log(`\n${colors.green}${colors.bright}Passed Validations:${colors.reset}`);
      console.log(`  ${colors.green}✓${colors.reset} ${successes.length} validations passed`);
    }

    // Print summary
    console.log('\n' + '='.repeat(80));
    console.log(`\n${colors.bright}Summary:${colors.reset}`);
    console.log(`  Total: ${this.results.length}`);
    console.log(`  ${colors.green}Passed: ${passed}${colors.reset}`);
    console.log(`  ${colors.yellow}Failed: ${failed}${colors.reset}`);
    console.log(`  ${colors.red}Critical: ${critical}${colors.reset}`);

    if (failed > 0) {
      console.log(`\n${colors.yellow}Run with --fix to attempt automatic fixes${colors.reset}`);
    }

    console.log('\n' + '='.repeat(80) + '\n');
  }

  // Run all validations
  public async validate(): Promise<number> {
    console.log(`${colors.bright}${colors.cyan}Starting Integration Validation...${colors.reset}\n`);

    if (this.shouldFix) {
      console.log(`${colors.yellow}Auto-fix mode enabled${colors.reset}\n`);
    }

    try {
      // Phase 1: Environment
      console.log(`${colors.cyan}Phase 1: Environment Validation${colors.reset}`);
      this.validateNodeVersion();
      this.validateNpmVersion();

      // Phase 2: Dependencies
      console.log(`${colors.cyan}Phase 2: Dependency Validation${colors.reset}`);
      this.validateDependencies();
      this.validateEnvironmentVariables();

      // Phase 3: Files
      console.log(`${colors.cyan}Phase 3: File Validation${colors.reset}`);
      this.validateDatabaseMigrations();
      this.validateSourceFiles();
      this.validateTestFiles();

      // Phase 4: Code Quality
      console.log(`${colors.cyan}Phase 4: Code Quality Validation${colors.reset}`);
      this.validateTypeScript();
      this.validateLinting();

      // Phase 5: Tests
      console.log(`${colors.cyan}Phase 5: Test Validation${colors.reset}`);
      this.validateUnitTests();

      // Phase 6: Build
      console.log(`${colors.cyan}Phase 6: Build Validation${colors.reset}`);
      this.validateBuild();

      // Phase 7: Security
      console.log(`${colors.cyan}Phase 7: Security Validation${colors.reset}`);
      this.validateSecurity();

      // Print results
      this.printResults();

      // Return exit code
      const failed = this.results.filter(r => !r.passed).length;
      const critical = this.results.filter(r => !r.passed && r.critical).length;

      if (critical > 0) {
        console.log(`${colors.red}${colors.bright}CRITICAL FAILURES DETECTED${colors.reset}`);
        console.log(`${colors.red}Integration validation failed. Fix critical issues before deploying.${colors.reset}\n`);
        return 1;
      }

      if (failed > 0) {
        console.log(`${colors.yellow}${colors.bright}NON-CRITICAL FAILURES DETECTED${colors.reset}`);
        console.log(`${colors.yellow}Consider fixing these issues before deploying.${colors.reset}\n`);
        return 1;
      }

      console.log(`${colors.green}${colors.bright}ALL VALIDATIONS PASSED${colors.reset}`);
      console.log(`${colors.green}Integration requirements met. Ready for deployment.${colors.reset}\n`);
      return 0;

    } catch (error) {
      console.error(`${colors.red}${colors.bright}Validation Error:${colors.reset}`, error);
      return 2;
    }
  }
}

// Main execution
async function main() {
  const validator = new IntegrationValidator();
  const exitCode = await validator.validate();
  process.exit(exitCode);
}

// Run if executed directly
if (require.main === module) {
  main().catch(error => {
    console.error(`${colors.red}Fatal Error:${colors.reset}`, error);
    process.exit(2);
  });
}

export { IntegrationValidator };
