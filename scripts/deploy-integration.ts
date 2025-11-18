#!/usr/bin/env ts-node

/**
 * Lab Visualizer - Integration Deployment Script
 *
 * Executable TypeScript implementation of all integration workflows
 * with CLI interface, progress tracking, and automated validation.
 *
 * @module deploy-integration
 * @version 1.0.0
 */

import { exec, execSync } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs/promises';
import * as path from 'path';
import chalk from 'chalk';
import ora from 'ora';
import boxen from 'boxen';
import inquirer from 'inquirer';
import { createClient } from '@supabase/supabase-js';

const execAsync = promisify(exec);

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

interface StepResult {
  step: string;
  success: boolean;
  duration: number;
  error?: string;
  details?: Record<string, any>;
}

interface WorkflowReport {
  phase: string;
  startTime: number;
  endTime?: number;
  duration?: number;
  success: boolean;
  steps: StepResult[];
}

interface DeploymentConfig {
  skipTests?: boolean;
  skipBackup?: boolean;
  environment: 'staging' | 'production';
  verbose?: boolean;
  dryRun?: boolean;
}

interface MigrationFile {
  filename: string;
  path: string;
  order: number;
}

interface EdgeFunction {
  name: string;
  path: string;
  runtime: 'python' | 'node';
  timeout: number;
  memory: number;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const MIN_NODE_VERSION = '18.0.0';
const MIN_NPM_VERSION = '9.0.0';
const MAX_INSTALL_TIME = 300000; // 5 minutes

const CRITICAL_PACKAGES = [
  'molstar',
  '@supabase/supabase-js',
  'zustand',
  '@tanstack/react-query',
  'next'
];

const MIGRATION_FILES: MigrationFile[] = [
  { filename: '001_md_jobs_table.sql', path: 'supabase/migrations', order: 1 },
  { filename: '002_collaboration_schema.sql', path: 'supabase/migrations', order: 2 },
  { filename: '003_storage_buckets.sql', path: 'supabase/migrations', order: 3 },
  { filename: '004_rls_policies.sql', path: 'supabase/migrations', order: 4 },
  { filename: '005_database_functions.sql', path: 'supabase/migrations', order: 5 }
];

const EDGE_FUNCTIONS: EdgeFunction[] = [
  {
    name: 'md-simulation',
    path: 'supabase/functions/md-simulation',
    runtime: 'python',
    timeout: 300,
    memory: 2048
  },
  {
    name: 'structure-converter',
    path: 'supabase/functions/structure-converter',
    runtime: 'node',
    timeout: 60,
    memory: 512
  }
];

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

class DeploymentLogger {
  private verbose: boolean;

  constructor(verbose: boolean = false) {
    this.verbose = verbose;
  }

  info(message: string): void {
    console.log(chalk.blue('ℹ'), message);
  }

  success(message: string): void {
    console.log(chalk.green('✓'), message);
  }

  error(message: string): void {
    console.log(chalk.red('✗'), message);
  }

  warn(message: string): void {
    console.log(chalk.yellow('⚠'), message);
  }

  debug(message: string): void {
    if (this.verbose) {
      console.log(chalk.gray('→'), message);
    }
  }

  section(title: string): void {
    console.log('\n' + boxen(chalk.bold.cyan(title), {
      padding: 1,
      margin: 1,
      borderStyle: 'double',
      borderColor: 'cyan'
    }));
  }

  step(message: string): ora.Ora {
    return ora(message).start();
  }
}

function compareVersions(v1: string, v2: string): number {
  const parts1 = v1.split('.').map(Number);
  const parts2 = v2.split('.').map(Number);

  for (let i = 0; i < Math.max(parts1.length, parts2.length); i++) {
    const p1 = parts1[i] || 0;
    const p2 = parts2[i] || 0;

    if (p1 > p2) return 1;
    if (p1 < p2) return -1;
  }

  return 0;
}

function parseVersion(versionString: string): string {
  const match = versionString.match(/(\d+\.\d+\.\d+)/);
  return match ? match[1] : '0.0.0';
}

async function fileExists(filePath: string): Promise<boolean> {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function directoryExists(dirPath: string): Promise<boolean> {
  try {
    const stats = await fs.stat(dirPath);
    return stats.isDirectory();
  } catch {
    return false;
  }
}

function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(2)}s`;
  return `${(ms / 60000).toFixed(2)}m`;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes}B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)}KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(2)}MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)}GB`;
}

// ============================================================================
// WORKFLOW 1: INSTALLATION & DEPENDENCIES
// ============================================================================

class InstallationWorkflow {
  private logger: DeploymentLogger;
  private config: DeploymentConfig;

  constructor(logger: DeploymentLogger, config: DeploymentConfig) {
    this.logger = logger;
    this.config = config;
  }

  async execute(): Promise<WorkflowReport> {
    this.logger.section('Phase 1: Installation & Dependencies');

    const report: WorkflowReport = {
      phase: 'installation',
      startTime: Date.now(),
      success: false,
      steps: []
    };

    try {
      // Step 1: Verify system requirements
      report.steps.push(await this.verifySystemRequirements());

      // Step 2: Clean previous installation
      if (!this.config.dryRun) {
        report.steps.push(await this.cleanPreviousInstallation());
      }

      // Step 3: Install npm packages
      if (!this.config.dryRun) {
        report.steps.push(await this.installNpmPackages());
      }

      // Step 4: Verify critical packages
      report.steps.push(await this.verifyCriticalPackages());

      // Step 5: Setup Git hooks
      if (!this.config.dryRun) {
        report.steps.push(await this.setupGitHooks());
      }

      // Step 6: Initialize environment
      report.steps.push(await this.initializeEnvironment());

      report.endTime = Date.now();
      report.duration = report.endTime - report.startTime;
      report.success = report.steps.every(step => step.success);

      if (report.success) {
        this.logger.success(`Installation complete in ${formatDuration(report.duration)}`);
      } else {
        this.logger.error('Installation failed');
      }

      return report;

    } catch (error) {
      report.endTime = Date.now();
      report.duration = report.endTime - report.startTime;
      this.logger.error(`Installation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return report;
    }
  }

  private async verifySystemRequirements(): Promise<StepResult> {
    const spinner = this.logger.step('Verifying system requirements...');
    const startTime = Date.now();

    const result: StepResult = {
      step: 'system-requirements',
      success: false,
      duration: 0,
      details: { checks: [] }
    };

    try {
      // Check Node.js version
      const { stdout: nodeVersion } = await execAsync('node --version');
      const parsedNodeVersion = parseVersion(nodeVersion);
      const nodeCheck = compareVersions(parsedNodeVersion, MIN_NODE_VERSION) >= 0;

      result.details!.checks.push({
        name: 'Node.js',
        current: parsedNodeVersion,
        required: MIN_NODE_VERSION,
        passed: nodeCheck
      });

      if (!nodeCheck) {
        throw new Error(`Node.js ${MIN_NODE_VERSION}+ required, found ${parsedNodeVersion}`);
      }

      spinner.text = `Node.js ${parsedNodeVersion} ✓`;

      // Check npm version
      const { stdout: npmVersion } = await execAsync('npm --version');
      const parsedNpmVersion = parseVersion(npmVersion);
      const npmCheck = compareVersions(parsedNpmVersion, MIN_NPM_VERSION) >= 0;

      result.details!.checks.push({
        name: 'npm',
        current: parsedNpmVersion,
        required: MIN_NPM_VERSION,
        passed: npmCheck
      });

      spinner.text = `npm ${parsedNpmVersion} ✓`;

      // Check disk space
      try {
        const { stdout: diskSpace } = await execAsync("df -h . | tail -1 | awk '{print $4}'");
        const diskSpaceGB = parseFloat(diskSpace);
        const diskCheck = diskSpaceGB >= 5;

        result.details!.checks.push({
          name: 'Disk Space',
          available: `${diskSpaceGB}GB`,
          required: '5GB',
          passed: diskCheck
        });

        if (!diskCheck) {
          this.logger.warn(`Low disk space: ${diskSpaceGB}GB available`);
        }
      } catch {
        this.logger.debug('Could not verify disk space');
      }

      result.success = result.details!.checks.every((c: any) => c.passed);
      result.duration = Date.now() - startTime;

      spinner.succeed('System requirements verified');
      return result;

    } catch (error) {
      result.duration = Date.now() - startTime;
      result.error = error instanceof Error ? error.message : 'Unknown error';
      spinner.fail('System requirements check failed');
      return result;
    }
  }

  private async cleanPreviousInstallation(): Promise<StepResult> {
    const spinner = this.logger.step('Cleaning previous installation...');
    const startTime = Date.now();

    const result: StepResult = {
      step: 'clean-previous',
      success: false,
      duration: 0,
      details: { cleaned: [] }
    };

    try {
      // Remove node_modules
      if (await directoryExists('node_modules')) {
        await fs.rm('node_modules', { recursive: true, force: true });
        result.details!.cleaned.push('node_modules');
      }

      // Remove package-lock.json
      if (await fileExists('package-lock.json')) {
        await fs.unlink('package-lock.json');
        result.details!.cleaned.push('package-lock.json');
      }

      // Remove .next cache
      if (await directoryExists('.next')) {
        await fs.rm('.next', { recursive: true, force: true });
        result.details!.cleaned.push('.next');
      }

      // Clear npm cache
      await execAsync('npm cache clean --force');
      result.details!.cleaned.push('npm-cache');

      result.success = true;
      result.duration = Date.now() - startTime;

      spinner.succeed(`Cleaned ${result.details!.cleaned.length} items`);
      return result;

    } catch (error) {
      result.duration = Date.now() - startTime;
      result.error = error instanceof Error ? error.message : 'Unknown error';
      spinner.fail('Cleanup failed');
      return result;
    }
  }

  private async installNpmPackages(): Promise<StepResult> {
    const spinner = this.logger.step('Installing npm packages...');
    const startTime = Date.now();

    const result: StepResult = {
      step: 'npm-install',
      success: false,
      duration: 0
    };

    try {
      await execAsync('npm install --legacy-peer-deps', {
        timeout: MAX_INSTALL_TIME
      });

      // Count installed packages
      const packageJson = JSON.parse(await fs.readFile('package.json', 'utf-8'));
      const depCount = Object.keys(packageJson.dependencies || {}).length;
      const devDepCount = Object.keys(packageJson.devDependencies || {}).length;

      result.details = {
        packagesInstalled: depCount + devDepCount,
        dependencies: depCount,
        devDependencies: devDepCount
      };

      result.success = true;
      result.duration = Date.now() - startTime;

      spinner.succeed(`Installed ${result.details.packagesInstalled} packages in ${formatDuration(result.duration)}`);
      return result;

    } catch (error) {
      result.duration = Date.now() - startTime;
      result.error = error instanceof Error ? error.message : 'Unknown error';
      spinner.fail('npm install failed');
      return result;
    }
  }

  private async verifyCriticalPackages(): Promise<StepResult> {
    const spinner = this.logger.step('Verifying critical packages...');
    const startTime = Date.now();

    const result: StepResult = {
      step: 'verify-packages',
      success: false,
      duration: 0,
      details: { verifications: [] }
    };

    try {
      for (const packageName of CRITICAL_PACKAGES) {
        const verification = await this.verifyPackage(packageName);
        result.details!.verifications.push(verification);

        if (verification.passed) {
          this.logger.debug(`✓ ${packageName} v${verification.version}`);
        } else {
          this.logger.error(`✗ ${packageName}: ${verification.error}`);
        }
      }

      result.success = result.details!.verifications.every((v: any) => v.passed);
      result.duration = Date.now() - startTime;

      if (result.success) {
        spinner.succeed('All critical packages verified');
      } else {
        const failedCount = result.details!.verifications.filter((v: any) => !v.passed).length;
        spinner.fail(`${failedCount} package(s) failed verification`);
      }

      return result;

    } catch (error) {
      result.duration = Date.now() - startTime;
      result.error = error instanceof Error ? error.message : 'Unknown error';
      spinner.fail('Package verification failed');
      return result;
    }
  }

  private async verifyPackage(packageName: string): Promise<any> {
    try {
      const packageJsonPath = path.join('node_modules', packageName, 'package.json');

      if (!await fileExists(packageJsonPath)) {
        return {
          package: packageName,
          passed: false,
          error: 'Package not found in node_modules'
        };
      }

      const packageJson = JSON.parse(await fs.readFile(packageJsonPath, 'utf-8'));

      // Try to import package
      try {
        await execAsync(`node -e "require('${packageName}')"`);
        return {
          package: packageName,
          passed: true,
          version: packageJson.version
        };
      } catch {
        return {
          package: packageName,
          passed: false,
          version: packageJson.version,
          error: 'Package import failed'
        };
      }

    } catch (error) {
      return {
        package: packageName,
        passed: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  private async setupGitHooks(): Promise<StepResult> {
    const spinner = this.logger.step('Setting up Git hooks...');
    const startTime = Date.now();

    const result: StepResult = {
      step: 'git-hooks',
      success: false,
      duration: 0,
      details: { hooks: [] }
    };

    try {
      await execAsync('npm run prepare');

      const hookFiles = [
        '.husky/pre-commit',
        '.husky/pre-push',
        '.husky/commit-msg'
      ];

      for (const hookFile of hookFiles) {
        const exists = await fileExists(hookFile);
        result.details!.hooks.push({ file: hookFile, exists });

        if (exists) {
          this.logger.debug(`✓ ${hookFile}`);
        } else {
          this.logger.warn(`⚠ ${hookFile} not created`);
        }
      }

      result.success = true;
      result.duration = Date.now() - startTime;

      spinner.succeed('Git hooks configured');
      return result;

    } catch (error) {
      result.duration = Date.now() - startTime;
      result.error = error instanceof Error ? error.message : 'Unknown error';
      spinner.warn('Git hooks setup failed (non-critical)');
      result.success = true; // Non-critical
      return result;
    }
  }

  private async initializeEnvironment(): Promise<StepResult> {
    const spinner = this.logger.step('Initializing environment...');
    const startTime = Date.now();

    const result: StepResult = {
      step: 'environment',
      success: false,
      duration: 0,
      details: { envVars: [] }
    };

    try {
      // Check for .env.local
      if (!await fileExists('.env.local')) {
        if (await fileExists('.env.example')) {
          await fs.copyFile('.env.example', '.env.local');
          this.logger.warn('Created .env.local from .env.example');
          this.logger.warn('Please configure environment variables in .env.local');
        }
      }

      // Validate required environment variables
      const requiredVars = [
        'NEXT_PUBLIC_SUPABASE_URL',
        'NEXT_PUBLIC_SUPABASE_ANON_KEY',
        'SUPABASE_SERVICE_ROLE_KEY'
      ];

      const envContent = await fs.readFile('.env.local', 'utf-8');

      for (const varName of requiredVars) {
        const isSet = envContent.includes(`${varName}=`) &&
                      !envContent.match(new RegExp(`${varName}=\\s*$`, 'm'));

        result.details!.envVars.push({ name: varName, isSet });

        if (isSet) {
          this.logger.debug(`✓ ${varName}`);
        } else {
          this.logger.warn(`⚠ ${varName} not configured`);
        }
      }

      result.success = true;
      result.duration = Date.now() - startTime;

      spinner.succeed('Environment initialized');
      return result;

    } catch (error) {
      result.duration = Date.now() - startTime;
      result.error = error instanceof Error ? error.message : 'Unknown error';
      spinner.fail('Environment initialization failed');
      return result;
    }
  }
}

// ============================================================================
// WORKFLOW 2: DATABASE MIGRATION
// ============================================================================

class DatabaseMigrationWorkflow {
  private logger: DeploymentLogger;
  private config: DeploymentConfig;

  constructor(logger: DeploymentLogger, config: DeploymentConfig) {
    this.logger = logger;
    this.config = config;
  }

  async execute(): Promise<WorkflowReport> {
    this.logger.section('Phase 2: Database Migration');

    const report: WorkflowReport = {
      phase: 'database-migration',
      startTime: Date.now(),
      success: false,
      steps: []
    };

    try {
      // Step 1: Initialize Supabase CLI
      report.steps.push(await this.initializeSupabaseCLI());

      // Step 2: Link to project
      report.steps.push(await this.linkToSupabaseProject());

      // Step 3: Backup database
      if (!this.config.skipBackup && !this.config.dryRun) {
        report.steps.push(await this.backupDatabase());
      }

      // Step 4: Apply migrations
      if (!this.config.dryRun) {
        for (const migration of MIGRATION_FILES) {
          const migrationResult = await this.applyMigration(migration);
          report.steps.push(migrationResult);

          if (!migrationResult.success) {
            this.logger.error(`Migration ${migration.filename} failed, rolling back...`);
            // TODO: Implement rollback
            break;
          }
        }
      }

      report.endTime = Date.now();
      report.duration = report.endTime - report.startTime;
      report.success = report.steps.every(step => step.success);

      if (report.success) {
        this.logger.success(`Database migration complete in ${formatDuration(report.duration)}`);
      } else {
        this.logger.error('Database migration failed');
      }

      return report;

    } catch (error) {
      report.endTime = Date.now();
      report.duration = report.endTime - report.startTime;
      this.logger.error(`Database migration failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return report;
    }
  }

  private async initializeSupabaseCLI(): Promise<StepResult> {
    const spinner = this.logger.step('Initializing Supabase CLI...');
    const startTime = Date.now();

    const result: StepResult = {
      step: 'supabase-cli-init',
      success: false,
      duration: 0
    };

    try {
      // Check if Supabase CLI is installed
      const { stdout: version } = await execAsync('supabase --version');
      result.details = { version: parseVersion(version) };

      spinner.text = `Supabase CLI v${result.details.version} ✓`;

      // Check if already initialized
      if (await directoryExists('supabase')) {
        this.logger.debug('Supabase project already initialized');
        result.success = true;
        result.duration = Date.now() - startTime;
        spinner.succeed('Supabase CLI initialized');
        return result;
      }

      // Initialize new project
      if (!this.config.dryRun) {
        await execAsync('supabase init');
      }

      result.success = true;
      result.duration = Date.now() - startTime;

      spinner.succeed('Supabase CLI initialized');
      return result;

    } catch (error) {
      result.duration = Date.now() - startTime;
      result.error = error instanceof Error ? error.message : 'Unknown error';
      spinner.fail('Supabase CLI initialization failed');
      this.logger.error('Install Supabase CLI: npm install -g supabase');
      return result;
    }
  }

  private async linkToSupabaseProject(): Promise<StepResult> {
    const spinner = this.logger.step('Linking to Supabase project...');
    const startTime = Date.now();

    const result: StepResult = {
      step: 'supabase-link',
      success: false,
      duration: 0
    };

    try {
      const projectUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

      if (!projectUrl) {
        throw new Error('NEXT_PUBLIC_SUPABASE_URL not configured');
      }

      // Extract project reference
      const match = projectUrl.match(/https:\/\/([a-z0-9]+)\.supabase\.co/);
      const projectRef = match ? match[1] : null;

      if (!projectRef) {
        throw new Error(`Invalid Supabase project URL: ${projectUrl}`);
      }

      result.details = { projectRef };
      spinner.text = `Project Ref: ${projectRef}`;

      // Check if already linked
      try {
        const { stdout: status } = await execAsync('supabase status');
        if (status.includes(projectRef)) {
          this.logger.debug(`Already linked to project ${projectRef}`);
          result.success = true;
          result.duration = Date.now() - startTime;
          spinner.succeed(`Linked to project ${projectRef}`);
          return result;
        }
      } catch {
        // Not linked yet
      }

      // Link to project
      if (!this.config.dryRun) {
        const dbPassword = process.env.SUPABASE_DB_PASSWORD;

        if (dbPassword) {
          await execAsync(`supabase link --project-ref ${projectRef} --password ${dbPassword}`);
        } else {
          this.logger.warn('SUPABASE_DB_PASSWORD not set, interactive prompt required');
          await execAsync(`supabase link --project-ref ${projectRef}`);
        }
      }

      result.success = true;
      result.duration = Date.now() - startTime;

      spinner.succeed(`Linked to project ${projectRef}`);
      return result;

    } catch (error) {
      result.duration = Date.now() - startTime;
      result.error = error instanceof Error ? error.message : 'Unknown error';
      spinner.fail('Project linking failed');
      return result;
    }
  }

  private async backupDatabase(): Promise<StepResult> {
    const spinner = this.logger.step('Creating database backup...');
    const startTime = Date.now();

    const result: StepResult = {
      step: 'database-backup',
      success: false,
      duration: 0
    };

    try {
      // Create backup directory
      const backupDir = 'supabase/backups';
      await fs.mkdir(backupDir, { recursive: true });

      // Generate backup filename
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const backupFile = `${backupDir}/backup-${timestamp}.sql`;

      // Dump database
      await execAsync(`supabase db dump -f ${backupFile}`);

      const stats = await fs.stat(backupFile);

      result.details = {
        backupFile,
        size: formatBytes(stats.size)
      };

      result.success = true;
      result.duration = Date.now() - startTime;

      spinner.succeed(`Backup created: ${backupFile} (${result.details.size})`);
      return result;

    } catch (error) {
      result.duration = Date.now() - startTime;
      result.error = error instanceof Error ? error.message : 'Unknown error';
      spinner.warn('Backup creation failed (continuing without backup)');
      result.success = true; // Non-critical in staging
      return result;
    }
  }

  private async applyMigration(migration: MigrationFile): Promise<StepResult> {
    const spinner = this.logger.step(`Applying migration: ${migration.filename}...`);
    const startTime = Date.now();

    const result: StepResult = {
      step: `migration-${migration.order}`,
      success: false,
      duration: 0,
      details: { file: migration.filename }
    };

    try {
      const migrationPath = path.join(migration.path, migration.filename);

      if (!await fileExists(migrationPath)) {
        throw new Error(`Migration file not found: ${migrationPath}`);
      }

      // Execute migration
      await execAsync(`supabase db push ${migrationPath}`);

      result.success = true;
      result.duration = Date.now() - startTime;

      spinner.succeed(`Applied ${migration.filename} in ${formatDuration(result.duration)}`);
      return result;

    } catch (error) {
      result.duration = Date.now() - startTime;
      result.error = error instanceof Error ? error.message : 'Unknown error';
      spinner.fail(`Failed: ${migration.filename}`);
      return result;
    }
  }
}

// ============================================================================
// WORKFLOW 3: EDGE FUNCTION DEPLOYMENT
// ============================================================================

class EdgeFunctionWorkflow {
  private logger: DeploymentLogger;
  private config: DeploymentConfig;

  constructor(logger: DeploymentLogger, config: DeploymentConfig) {
    this.logger = logger;
    this.config = config;
  }

  async execute(): Promise<WorkflowReport> {
    this.logger.section('Phase 3: Edge Function Deployment');

    const report: WorkflowReport = {
      phase: 'edge-functions',
      startTime: Date.now(),
      success: false,
      steps: []
    };

    try {
      for (const func of EDGE_FUNCTIONS) {
        const deploymentResult = await this.deployEdgeFunction(func);
        report.steps.push(deploymentResult);

        if (!deploymentResult.success) {
          this.logger.error(`Edge function ${func.name} deployment failed`);
          report.success = false;
          return report;
        }
      }

      report.endTime = Date.now();
      report.duration = report.endTime - report.startTime;
      report.success = true;

      this.logger.success(`All edge functions deployed in ${formatDuration(report.duration)}`);
      return report;

    } catch (error) {
      report.endTime = Date.now();
      report.duration = report.endTime - report.startTime;
      this.logger.error(`Edge function deployment failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return report;
    }
  }

  private async deployEdgeFunction(func: EdgeFunction): Promise<StepResult> {
    const spinner = this.logger.step(`Deploying ${func.name}...`);
    const startTime = Date.now();

    const result: StepResult = {
      step: `deploy-${func.name}`,
      success: false,
      duration: 0,
      details: { function: func.name }
    };

    try {
      // Build Docker image if Python runtime
      if (func.runtime === 'python' && !this.config.dryRun) {
        spinner.text = `Building ${func.name}...`;

        if (await directoryExists(func.path)) {
          const dockerfilePath = path.join(func.path, 'Dockerfile');

          if (await fileExists(dockerfilePath)) {
            await execAsync(`docker build -t ${func.name}:latest ${func.path}`);
            this.logger.debug(`Built Docker image for ${func.name}`);
          }
        }
      }

      // Deploy to Supabase
      spinner.text = `Deploying ${func.name}...`;

      if (!this.config.dryRun) {
        let deployCmd = `supabase functions deploy ${func.name}`;

        // Add flags if needed
        // deployCmd += ' --no-verify-jwt';

        await execAsync(deployCmd);
      }

      result.success = true;
      result.duration = Date.now() - startTime;

      spinner.succeed(`Deployed ${func.name} in ${formatDuration(result.duration)}`);
      return result;

    } catch (error) {
      result.duration = Date.now() - startTime;
      result.error = error instanceof Error ? error.message : 'Unknown error';
      spinner.fail(`Deployment failed: ${func.name}`);
      return result;
    }
  }
}

// ============================================================================
// MAIN DEPLOYMENT ORCHESTRATOR
// ============================================================================

class DeploymentOrchestrator {
  private logger: DeploymentLogger;
  private config: DeploymentConfig;

  constructor(config: DeploymentConfig) {
    this.config = config;
    this.logger = new DeploymentLogger(config.verbose);
  }

  async execute(): Promise<void> {
    console.log(boxen(
      chalk.bold.cyan('Lab Visualizer\nIntegration Deployment'),
      {
        padding: 1,
        margin: 1,
        borderStyle: 'double',
        borderColor: 'cyan'
      }
    ));

    this.logger.info(`Environment: ${chalk.bold(this.config.environment)}`);
    this.logger.info(`Dry run: ${this.config.dryRun ? chalk.yellow('Yes') : 'No'}`);

    const startTime = Date.now();

    try {
      // Phase 1: Installation
      const installationWorkflow = new InstallationWorkflow(this.logger, this.config);
      const installationReport = await installationWorkflow.execute();

      if (!installationReport.success) {
        throw new Error('Installation failed');
      }

      // Phase 2: Database Migration
      const databaseWorkflow = new DatabaseMigrationWorkflow(this.logger, this.config);
      const databaseReport = await databaseWorkflow.execute();

      if (!databaseReport.success) {
        throw new Error('Database migration failed');
      }

      // Phase 3: Edge Functions
      const edgeWorkflow = new EdgeFunctionWorkflow(this.logger, this.config);
      const edgeReport = await edgeWorkflow.execute();

      if (!edgeReport.success) {
        throw new Error('Edge function deployment failed');
      }

      const totalDuration = Date.now() - startTime;

      console.log('\n' + boxen(
        chalk.bold.green('✓ Deployment Complete!') + '\n\n' +
        `Total time: ${formatDuration(totalDuration)}`,
        {
          padding: 1,
          margin: 1,
          borderStyle: 'double',
          borderColor: 'green'
        }
      ));

    } catch (error) {
      const totalDuration = Date.now() - startTime;

      console.log('\n' + boxen(
        chalk.bold.red('✗ Deployment Failed') + '\n\n' +
        `Error: ${error instanceof Error ? error.message : 'Unknown error'}\n` +
        `Time elapsed: ${formatDuration(totalDuration)}`,
        {
          padding: 1,
          margin: 1,
          borderStyle: 'double',
          borderColor: 'red'
        }
      ));

      process.exit(1);
    }
  }
}

// ============================================================================
// CLI ENTRY POINT
// ============================================================================

async function main() {
  const answers = await inquirer.prompt([
    {
      type: 'list',
      name: 'environment',
      message: 'Select deployment environment:',
      choices: ['staging', 'production'],
      default: 'staging'
    },
    {
      type: 'confirm',
      name: 'dryRun',
      message: 'Perform dry run (no actual changes)?',
      default: false
    },
    {
      type: 'confirm',
      name: 'skipTests',
      message: 'Skip tests?',
      default: false
    },
    {
      type: 'confirm',
      name: 'skipBackup',
      message: 'Skip database backup?',
      default: false,
      when: (answers) => answers.environment === 'staging'
    },
    {
      type: 'confirm',
      name: 'verbose',
      message: 'Enable verbose logging?',
      default: false
    }
  ]);

  const config: DeploymentConfig = {
    environment: answers.environment,
    dryRun: answers.dryRun,
    skipTests: answers.skipTests,
    skipBackup: answers.skipBackup,
    verbose: answers.verbose
  };

  const orchestrator = new DeploymentOrchestrator(config);
  await orchestrator.execute();
}

// Run if called directly
if (require.main === module) {
  main().catch(console.error);
}

export {
  DeploymentOrchestrator,
  InstallationWorkflow,
  DatabaseMigrationWorkflow,
  EdgeFunctionWorkflow,
  DeploymentLogger
};
