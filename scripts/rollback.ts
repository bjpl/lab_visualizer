#!/usr/bin/env ts-node

/**
 * Lab Visualizer - Automated Rollback Script
 *
 * Handles rollback procedures with safety checks and alert integration
 *
 * @module rollback
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

interface RollbackConfig {
  reason: string;
  rollbackDatabase: boolean;
  notifyTeam: boolean;
  updateStatusPage: boolean;
  dryRun: boolean;
  verbose: boolean;
}

interface RollbackStep {
  step: string;
  success: boolean;
  duration: number;
  error?: string;
  details?: Record<string, any>;
}

interface RollbackReport {
  reason: string;
  startTime: number;
  endTime?: number;
  duration?: number;
  success: boolean;
  steps: RollbackStep[];
}

interface Deployment {
  id: string;
  url: string;
  timestamp: number;
  state: string;
  meta: {
    githubCommitSha?: string;
    githubCommitMessage?: string;
    githubCommitAuthorName?: string;
  };
}

// ============================================================================
// ROLLBACK LOGGER
// ============================================================================

class RollbackLogger {
  private verbose: boolean;

  constructor(verbose: boolean = false) {
    this.verbose = verbose;
  }

  critical(message: string): void {
    console.log(chalk.red.bold('🚨 CRITICAL:'), chalk.red(message));
  }

  warn(message: string): void {
    console.log(chalk.yellow('⚠️  WARNING:'), message);
  }

  info(message: string): void {
    console.log(chalk.blue('ℹ️  INFO:'), message);
  }

  success(message: string): void {
    console.log(chalk.green('✅ SUCCESS:'), message);
  }

  debug(message: string): void {
    if (this.verbose) {
      console.log(chalk.gray('→'), message);
    }
  }

  section(title: string): void {
    console.log('\n' + boxen(chalk.bold.red(title), {
      padding: 1,
      margin: 1,
      borderStyle: 'double',
      borderColor: 'red'
    }));
  }

  step(message: string): ora.Ora {
    return ora(message).start();
  }
}

// ============================================================================
// SAFETY CHECKS
// ============================================================================

class SafetyChecker {
  private logger: RollbackLogger;

  constructor(logger: RollbackLogger) {
    this.logger = logger;
  }

  async performPreRollbackChecks(): Promise<boolean> {
    this.logger.section('Safety Checks');

    const checks: Array<{ name: string; passed: boolean; critical: boolean }> = [];

    // Check 1: Verify previous deployment exists
    const spinner1 = this.logger.step('Checking for previous deployment...');
    try {
      const { stdout } = await execAsync('vercel ls --limit 2');
      const deployments = this.parseVercelDeployments(stdout);

      if (deployments.length < 2) {
        spinner1.fail('No previous deployment found');
        checks.push({ name: 'Previous deployment', passed: false, critical: true });
      } else {
        spinner1.succeed('Previous deployment found');
        checks.push({ name: 'Previous deployment', passed: true, critical: true });
      }
    } catch (error) {
      spinner1.fail('Could not check deployments');
      checks.push({ name: 'Previous deployment', passed: false, critical: true });
    }

    // Check 2: Verify Supabase connection
    const spinner2 = this.logger.step('Verifying Supabase connection...');
    try {
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL || '',
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
      );

      const { error } = await supabase.from('md_simulation_jobs').select('count').limit(1);

      if (error) {
        spinner2.fail('Supabase connection failed');
        checks.push({ name: 'Supabase connection', passed: false, critical: true });
      } else {
        spinner2.succeed('Supabase connection verified');
        checks.push({ name: 'Supabase connection', passed: true, critical: true });
      }
    } catch (error) {
      spinner2.fail('Supabase connection error');
      checks.push({ name: 'Supabase connection', passed: false, critical: true });
    }

    // Check 3: Verify backup exists (if database rollback needed)
    const spinner3 = this.logger.step('Checking for database backup...');
    try {
      const backupDir = 'supabase/backups';
      const files = await fs.readdir(backupDir);
      const backups = files.filter(f => f.startsWith('backup-') && f.endsWith('.sql'));

      if (backups.length === 0) {
        spinner3.warn('No database backups found');
        checks.push({ name: 'Database backup', passed: false, critical: false });
      } else {
        spinner3.succeed(`Found ${backups.length} backup(s)`);
        checks.push({ name: 'Database backup', passed: true, critical: false });
      }
    } catch (error) {
      spinner3.warn('Could not check for backups');
      checks.push({ name: 'Database backup', passed: false, critical: false });
    }

    // Check 4: Verify Git status
    const spinner4 = this.logger.step('Checking Git status...');
    try {
      const { stdout } = await execAsync('git status --porcelain');

      if (stdout.trim().length > 0) {
        spinner4.warn('Working directory has uncommitted changes');
        checks.push({ name: 'Git status', passed: false, critical: false });
      } else {
        spinner4.succeed('Working directory is clean');
        checks.push({ name: 'Git status', passed: true, critical: false });
      }
    } catch (error) {
      spinner4.warn('Could not check Git status');
      checks.push({ name: 'Git status', passed: false, critical: false });
    }

    // Summary
    console.log('\n' + chalk.bold('Safety Check Summary:'));
    for (const check of checks) {
      const icon = check.passed ? chalk.green('✓') : chalk.red('✗');
      const critical = check.critical ? chalk.red('[CRITICAL]') : '';
      console.log(`  ${icon} ${check.name} ${critical}`);
    }

    const criticalFailed = checks.filter(c => c.critical && !c.passed).length;

    if (criticalFailed > 0) {
      this.logger.critical(`${criticalFailed} critical safety check(s) failed`);
      return false;
    }

    return true;
  }

  private parseVercelDeployments(output: string): Deployment[] {
    // Simple parser for Vercel deployments
    const lines = output.split('\n').filter(l => l.trim().length > 0);
    return lines.slice(1).map((line, index) => ({
      id: `deployment-${index}`,
      url: line.split(/\s+/)[1] || '',
      timestamp: Date.now(),
      state: 'READY',
      meta: {}
    }));
  }
}

// ============================================================================
// ROLLBACK EXECUTOR
// ============================================================================

class RollbackExecutor {
  private logger: RollbackLogger;
  private config: RollbackConfig;

  constructor(logger: RollbackLogger, config: RollbackConfig) {
    this.logger = logger;
    this.config = config;
  }

  async execute(): Promise<RollbackReport> {
    this.logger.section(`Rollback: ${this.config.reason}`);

    const report: RollbackReport = {
      reason: this.config.reason,
      startTime: Date.now(),
      success: false,
      steps: []
    };

    try {
      // Step 1: Get previous deployment
      report.steps.push(await this.getPreviousDeployment());

      if (!report.steps[report.steps.length - 1].success) {
        throw new Error('Could not find previous deployment');
      }

      // Step 2: Rollback Vercel deployment
      if (!this.config.dryRun) {
        report.steps.push(await this.rollbackVercel(report.steps[0].details?.deployment));
      } else {
        this.logger.info('[DRY RUN] Would rollback Vercel deployment');
        report.steps.push({
          step: 'rollback-vercel',
          success: true,
          duration: 0,
          details: { dryRun: true }
        });
      }

      // Step 3: Rollback database if needed
      if (this.config.rollbackDatabase && !this.config.dryRun) {
        report.steps.push(await this.rollbackDatabase());
      } else if (this.config.rollbackDatabase) {
        this.logger.info('[DRY RUN] Would rollback database');
        report.steps.push({
          step: 'rollback-database',
          success: true,
          duration: 0,
          details: { dryRun: true }
        });
      }

      // Step 4: Notify team
      if (this.config.notifyTeam && !this.config.dryRun) {
        report.steps.push(await this.notifyTeam());
      } else if (this.config.notifyTeam) {
        this.logger.info('[DRY RUN] Would notify team');
        report.steps.push({
          step: 'notify-team',
          success: true,
          duration: 0,
          details: { dryRun: true }
        });
      }

      // Step 5: Update status page
      if (this.config.updateStatusPage && !this.config.dryRun) {
        report.steps.push(await this.updateStatusPage());
      } else if (this.config.updateStatusPage) {
        this.logger.info('[DRY RUN] Would update status page');
        report.steps.push({
          step: 'update-status-page',
          success: true,
          duration: 0,
          details: { dryRun: true }
        });
      }

      report.endTime = Date.now();
      report.duration = report.endTime - report.startTime;
      report.success = report.steps.every(step => step.success);

      if (report.success) {
        this.logger.success(`Rollback complete in ${this.formatDuration(report.duration)}`);
      } else {
        this.logger.critical('Rollback failed');
      }

      return report;

    } catch (error) {
      report.endTime = Date.now();
      report.duration = report.endTime - report.startTime;
      this.logger.critical(`Rollback failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return report;
    }
  }

  private async getPreviousDeployment(): Promise<RollbackStep> {
    const spinner = this.logger.step('Getting previous deployment...');
    const startTime = Date.now();

    const result: RollbackStep = {
      step: 'get-previous-deployment',
      success: false,
      duration: 0
    };

    try {
      const { stdout } = await execAsync('vercel ls --limit 2');
      const lines = stdout.split('\n').filter(l => l.trim().length > 0);

      if (lines.length < 3) { // Header + current + previous
        throw new Error('No previous deployment found');
      }

      const previousLine = lines[2]; // Skip header and current
      const parts = previousLine.split(/\s+/);

      result.details = {
        deployment: {
          url: parts[1],
          age: parts[2],
          duration: parts[3]
        }
      };

      result.success = true;
      result.duration = Date.now() - startTime;

      spinner.succeed(`Previous deployment: ${result.details.deployment.url}`);
      return result;

    } catch (error) {
      result.duration = Date.now() - startTime;
      result.error = error instanceof Error ? error.message : 'Unknown error';
      spinner.fail('Could not get previous deployment');
      return result;
    }
  }

  private async rollbackVercel(deployment: any): Promise<RollbackStep> {
    const spinner = this.logger.step('Rolling back Vercel deployment...');
    const startTime = Date.now();

    const result: RollbackStep = {
      step: 'rollback-vercel',
      success: false,
      duration: 0
    };

    try {
      if (!deployment) {
        throw new Error('No deployment information provided');
      }

      // Promote previous deployment
      await execAsync(`vercel promote ${deployment.url}`);

      result.success = true;
      result.duration = Date.now() - startTime;

      spinner.succeed(`Rolled back to ${deployment.url}`);
      return result;

    } catch (error) {
      result.duration = Date.now() - startTime;
      result.error = error instanceof Error ? error.message : 'Unknown error';
      spinner.fail('Vercel rollback failed');
      return result;
    }
  }

  private async rollbackDatabase(): Promise<RollbackStep> {
    const spinner = this.logger.step('Rolling back database...');
    const startTime = Date.now();

    const result: RollbackStep = {
      step: 'rollback-database',
      success: false,
      duration: 0
    };

    try {
      // Find latest backup
      const backupDir = 'supabase/backups';
      const files = await fs.readdir(backupDir);
      const backups = files
        .filter(f => f.startsWith('backup-') && f.endsWith('.sql'))
        .sort()
        .reverse();

      if (backups.length === 0) {
        throw new Error('No backup found');
      }

      const latestBackup = path.join(backupDir, backups[0]);

      this.logger.info(`Using backup: ${backups[0]}`);

      // Reset database
      spinner.text = 'Resetting database...';
      await execAsync('supabase db reset');

      // Apply backup
      spinner.text = 'Applying backup...';
      await execAsync(`supabase db push ${latestBackup}`);

      result.details = {
        backup: backups[0],
        timestamp: this.extractTimestampFromBackup(backups[0])
      };

      result.success = true;
      result.duration = Date.now() - startTime;

      spinner.succeed(`Database rolled back to ${backups[0]}`);
      return result;

    } catch (error) {
      result.duration = Date.now() - startTime;
      result.error = error instanceof Error ? error.message : 'Unknown error';
      spinner.fail('Database rollback failed');
      return result;
    }
  }

  private async notifyTeam(): Promise<RollbackStep> {
    const spinner = this.logger.step('Notifying team...');
    const startTime = Date.now();

    const result: RollbackStep = {
      step: 'notify-team',
      success: false,
      duration: 0
    };

    try {
      // Send Slack notification
      const slackWebhook = process.env.SLACK_WEBHOOK_URL;

      if (slackWebhook) {
        const message = {
          text: `🚨 Production Rollback`,
          blocks: [
            {
              type: 'section',
              text: {
                type: 'mrkdwn',
                text: `*Production Rollback Initiated*\n\n*Reason:* ${this.config.reason}\n*Time:* ${new Date().toISOString()}`
              }
            }
          ]
        };

        await fetch(slackWebhook, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(message)
        });

        this.logger.info('Slack notification sent');
      }

      // Send PagerDuty alert
      const pagerDutyKey = process.env.PAGERDUTY_INTEGRATION_KEY;

      if (pagerDutyKey) {
        const alert = {
          routing_key: pagerDutyKey,
          event_action: 'trigger',
          payload: {
            summary: `Production rollback: ${this.config.reason}`,
            severity: 'error',
            source: 'deployment-script',
            custom_details: {
              reason: this.config.reason,
              timestamp: new Date().toISOString()
            }
          }
        };

        await fetch('https://events.pagerduty.com/v2/enqueue', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(alert)
        });

        this.logger.info('PagerDuty alert sent');
      }

      result.success = true;
      result.duration = Date.now() - startTime;

      spinner.succeed('Team notified');
      return result;

    } catch (error) {
      result.duration = Date.now() - startTime;
      result.error = error instanceof Error ? error.message : 'Unknown error';
      spinner.warn('Team notification failed (non-critical)');
      result.success = true; // Non-critical
      return result;
    }
  }

  private async updateStatusPage(): Promise<RollbackStep> {
    const spinner = this.logger.step('Updating status page...');
    const startTime = Date.now();

    const result: RollbackStep = {
      step: 'update-status-page',
      success: false,
      duration: 0
    };

    try {
      // Update status page (example using Statuspage.io)
      const statuspageApiKey = process.env.STATUSPAGE_API_KEY;
      const statuspagePageId = process.env.STATUSPAGE_PAGE_ID;

      if (statuspageApiKey && statuspagePageId) {
        const incident = {
          incident: {
            name: `Service degraded - Rollback in progress`,
            status: 'investigating',
            impact_override: 'minor',
            body: `We have rolled back a recent deployment due to: ${this.config.reason}. Service functionality is being restored.`,
            components: {
              [process.env.STATUSPAGE_COMPONENT_ID || '']: 'degraded_performance'
            }
          }
        };

        await fetch(`https://api.statuspage.io/v1/pages/${statuspagePageId}/incidents`, {
          method: 'POST',
          headers: {
            'Authorization': `OAuth ${statuspageApiKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(incident)
        });

        this.logger.info('Status page updated');
      }

      result.success = true;
      result.duration = Date.now() - startTime;

      spinner.succeed('Status page updated');
      return result;

    } catch (error) {
      result.duration = Date.now() - startTime;
      result.error = error instanceof Error ? error.message : 'Unknown error';
      spinner.warn('Status page update failed (non-critical)');
      result.success = true; // Non-critical
      return result;
    }
  }

  private extractTimestampFromBackup(filename: string): string {
    const match = filename.match(/backup-(.+)\.sql/);
    return match ? match[1] : 'unknown';
  }

  private formatDuration(ms: number): string {
    if (ms < 1000) return `${ms}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(2)}s`;
    return `${(ms / 60000).toFixed(2)}m`;
  }
}

// ============================================================================
// MAIN ROLLBACK ORCHESTRATOR
// ============================================================================

class RollbackOrchestrator {
  private logger: RollbackLogger;
  private safetyChecker: SafetyChecker;

  constructor(verbose: boolean = false) {
    this.logger = new RollbackLogger(verbose);
    this.safetyChecker = new SafetyChecker(this.logger);
  }

  async execute(config: RollbackConfig): Promise<void> {
    console.log(boxen(
      chalk.bold.red('⚠️  ROLLBACK PROCEDURE ⚠️'),
      {
        padding: 1,
        margin: 1,
        borderStyle: 'double',
        borderColor: 'red'
      }
    ));

    this.logger.warn(`Reason: ${chalk.bold(config.reason)}`);
    this.logger.info(`Dry run: ${config.dryRun ? chalk.yellow('Yes') : chalk.red('No')}`);

    // Perform safety checks
    const safetyChecksPassed = await this.safetyChecker.performPreRollbackChecks();

    if (!safetyChecksPassed) {
      this.logger.critical('Safety checks failed. Aborting rollback.');

      const { proceed } = await inquirer.prompt([
        {
          type: 'confirm',
          name: 'proceed',
          message: chalk.red('Safety checks failed. Force continue anyway?'),
          default: false
        }
      ]);

      if (!proceed) {
        this.logger.info('Rollback aborted by user');
        process.exit(1);
      }
    }

    // Confirm rollback
    if (!config.dryRun) {
      const { confirmed } = await inquirer.prompt([
        {
          type: 'confirm',
          name: 'confirmed',
          message: chalk.red.bold('Confirm rollback? This action cannot be undone.'),
          default: false
        }
      ]);

      if (!confirmed) {
        this.logger.info('Rollback cancelled by user');
        process.exit(0);
      }
    }

    // Execute rollback
    const executor = new RollbackExecutor(this.logger, config);
    const report = await executor.execute();

    // Display report
    console.log('\n' + boxen(
      report.success
        ? chalk.bold.green('✓ Rollback Complete')
        : chalk.bold.red('✗ Rollback Failed'),
      {
        padding: 1,
        margin: 1,
        borderStyle: 'double',
        borderColor: report.success ? 'green' : 'red'
      }
    ));

    console.log('\n' + chalk.bold('Rollback Summary:'));
    for (const step of report.steps) {
      const icon = step.success ? chalk.green('✓') : chalk.red('✗');
      console.log(`  ${icon} ${step.step} (${this.formatDuration(step.duration)})`);
      if (step.error) {
        console.log(`     ${chalk.red('Error:')} ${step.error}`);
      }
    }

    if (!report.success) {
      process.exit(1);
    }
  }

  private formatDuration(ms: number): string {
    if (ms < 1000) return `${ms}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(2)}s`;
    return `${(ms / 60000).toFixed(2)}m`;
  }
}

// ============================================================================
// CLI ENTRY POINT
// ============================================================================

async function main() {
  const answers = await inquirer.prompt([
    {
      type: 'input',
      name: 'reason',
      message: 'Reason for rollback:',
      validate: (input) => input.trim().length > 0 || 'Reason is required'
    },
    {
      type: 'confirm',
      name: 'rollbackDatabase',
      message: 'Rollback database to latest backup?',
      default: false
    },
    {
      type: 'confirm',
      name: 'notifyTeam',
      message: 'Notify team via Slack/PagerDuty?',
      default: true
    },
    {
      type: 'confirm',
      name: 'updateStatusPage',
      message: 'Update status page?',
      default: true
    },
    {
      type: 'confirm',
      name: 'dryRun',
      message: 'Perform dry run (no actual changes)?',
      default: false
    },
    {
      type: 'confirm',
      name: 'verbose',
      message: 'Enable verbose logging?',
      default: false
    }
  ]);

  const config: RollbackConfig = {
    reason: answers.reason,
    rollbackDatabase: answers.rollbackDatabase,
    notifyTeam: answers.notifyTeam,
    updateStatusPage: answers.updateStatusPage,
    dryRun: answers.dryRun,
    verbose: answers.verbose
  };

  const orchestrator = new RollbackOrchestrator(config.verbose);
  await orchestrator.execute(config);
}

// Run if called directly
if (require.main === module) {
  main().catch(console.error);
}

export { RollbackOrchestrator, RollbackExecutor, SafetyChecker, RollbackLogger };
