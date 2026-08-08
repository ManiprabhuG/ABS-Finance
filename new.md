# Finance.md

## Project Title

ABS Finance Management Software – Enterprise Loan & Mortgage Finance Dashboard

---

# Project Overview

Build a complete enterprise-grade Finance Management Dashboard for a finance company that provides:

* Mortgage Loans
* Normal Loans
* Manual Interest Rate Loans
* Slab-Based Interest Loans
* LTV (Loan-To-Value) Interest Slab Loans

The system must be designed as a real-world finance platform with professional workflows, approval processes, audit logs, financial reporting, and role-based access control.

The dashboard should be modern, secure, responsive, scalable, and suitable for daily finance operations.

---

# Core Design Requirements

## Design Style

Create a modern corporate finance dashboard with:

* Professional Banking & Finance UI
* Clean White Background
* Corporate Blue Primary Color
* Emerald Green for Success
* Orange for Warnings
* Red for Overdue Loans
* Dark Gray Text
* Glassmorphism Cards (Light)
* Premium Banking Layout
* Real-World Financial Software Appearance

---

## User Experience

Dashboard must provide:

* Fast Navigation
* Search Everywhere
* Smart Filters
* Mobile Responsive
* Tablet Responsive
* Desktop Responsive
* Professional Tables
* Quick Action Buttons
* Modern Charts
* Dark Mode
* Light Mode
* Theme Switcher

---

# Technology Stack

Use:

## Frontend

* Next.js Latest
* TypeScript
* Tailwind CSS
* Shadcn UI
* React Query
* React Hook Form
* Zod Validation

## Backend

* Next.js Server Actions
* Prisma ORM

## Database

* TiDB Cloud
* MySQL Compatible
* Prisma Schema Ready

## Authentication

* JWT Authentication
* Secure Session Management
* Password Hashing
* Role-Based Access Control

---

# Login System

## Admin Login

Create secure login page.

Fields:

* Username (Required)
* Password (Required)

Features:

* Remember Me
* Show Password
* Forgot Password
* Login Activity Tracking

---

# Role Management

Create Role-Based Access Control.

Roles:

## Super Admin

Full Access

## Branch Manager

Branch Operations

## Loan Officer

Loan Processing

## Finance Executive

Payment Collection

## Accountant

Financial Reports

## Auditor

Read Only Access

## Staff

Limited Access

---

# Dashboard Home

Create professional dashboard cards.

## Summary Cards

* Total Customers
* Active Loans
* Closed Loans
* Pending Approval Loans
* Mortgage Loans
* Normal Loans
* Overdue Loans
* Total Disbursed Amount
* Total Outstanding Amount
* Interest Earned
* Today's Collections
* Monthly Collections
* Cash In Hand
* Bank Balance

---

## Dashboard Charts

### Loan Distribution

* Mortgage Loan
* Normal Loan

### Collection Trend

Monthly Collection Graph

### Interest Income Trend

Monthly Interest Revenue

### Loan Status Analysis

* Active
* Closed
* Overdue
* Pending

---

# Customer Management

## Features

Create Customer
Edit Customer
Delete Customer
View Customer
Customer Ledger

## Required Fields

* Customer ID (Auto Generated)
* Full Name (Required)
* Mobile Number (Required)
* Alternate Number
* Aadhaar Number (Required)
* PAN Number
* Address (Required)
* City
* State
* Pincode
* Occupation
* Monthly Income
* Profile Photo

---

# Loan Management

Create complete loan lifecycle management.

---

## Loan Types

### Mortgage Loan

### Normal Loan

---

## Loan Creation

Required Fields:

* Loan Number (Auto Generated)
* Customer
* Loan Type
* Loan Amount
* Interest Type
* Interest Rate
* Loan Date
* Maturity Date
* Loan Officer
* Loan Status

---

## Loan Status

* Draft
* Pending Approval
* Approved
* Active
* Closed
* Rejected
* Overdue

---

# Interest Management

Create flexible interest configuration system.

---

## Interest Type Master

### Manual Interest

Admin manually enters interest percentage.

Example:

* 12%
* 18%
* 24%

---

### Fixed Slab Interest

Example:

| Loan Amount    | Interest |
| -------------- | -------- |
| 1 - 50000      | 12%      |
| 50001 - 100000 | 15%      |
| Above 100000   | 18%      |

---

### LTV Interest Slab

Example:

| LTV Range | Interest |
| --------- | -------- |
| 0% - 50%  | 10%      |
| 51% - 70% | 12%      |
| 71% - 90% | 15%      |

---

## Interest Calculator

Automatically calculate:

* Monthly Interest
* Daily Interest
* Total Interest
* Due Interest
* Outstanding Interest

---

# Mortgage Management

Create dedicated mortgage section.

---

## Mortgage Asset Categories

* Land
* House
* Commercial Building
* Agricultural Land
* Apartment
* Plot
* Others

---

## Mortgage Details

Required Fields:

* Mortgage Number
* Customer
* Asset Type
* Property Value
* Market Value
* Loan To Value %
* Document Number
* Registration Date
* Mortgage Images
* Property Documents

---

# Loan Approval Workflow

Create approval flow.

Stages:

1. Loan Created
2. Verification
3. Manager Review
4. Approval
5. Disbursement
6. Active Loan

Maintain approval history.

---

# Collection Management

## EMI Collection

Required Fields:

* Receipt Number
* Customer
* Loan Number
* Collection Date
* Amount Paid
* Principal Amount
* Interest Amount
* Penalty Amount
* Payment Mode

---

## Payment Modes

* Cash
* Bank Transfer
* UPI
* Cheque

---

## Collection Features

* Auto Receipt
* Print Receipt
* Download PDF
* Share Receipt

---

# Penalty Management

Configure:

* Daily Penalty
* Monthly Penalty
* Late Payment Charges
* Default Charges

Auto-calculate penalties.

---

# Finance & Accounts

Create complete accounting section.

---

## Bank Accounts

Features:

* Multiple Bank Accounts
* Cash In Hand

Required Fields:

* Account Name
* Bank Name
* Account Number
* Opening Balance

---

## Income Management

Sources:

* Interest Income
* Processing Fee
* Penalty Income
* Other Income

---

## Expense Management

Examples:

* Salary
* Rent
* Utilities
* Office Expense
* Maintenance

---

## Cash Flow

Automatically maintain:

* Opening Balance
* Income
* Expenses
* Closing Balance

---

# Customer Ledger

Show:

* Loan History
* Interest History
* Payment History
* Outstanding Balance
* Penalties
* Ledger Statements

---

# Reports Management

Create professional reports.

---

## Loan Reports

* Active Loans
* Closed Loans
* Mortgage Loans
* Overdue Loans

---

## Collection Reports

* Daily Collection
* Weekly Collection
* Monthly Collection
* Yearly Collection

---

## Interest Reports

* Interest Earned
* Pending Interest
* Interest Forecast

---

## Financial Reports

* Cash Flow Report
* Income Report
* Expense Report
* Profit Report
* Bank Balance Report

---

## Customer Reports

* Customer Ledger
* Customer Loan Summary
* Defaulter List

---

# Notification Center

Provide alerts for:

* Loan Due
* EMI Due
* Overdue Loan
* Pending Approval
* Collection Reminder

---

# Audit Logs

Track:

* Login Activities
* Data Creation
* Data Updates
* Data Deletion
* Approval Activities

Store:

* User
* Time
* Action
* Module

---

# Document Management

Allow storage of:

* Aadhaar
* PAN
* Mortgage Documents
* Loan Agreements
* Receipts
* KYC Documents

Features:

* Upload
* Download
* Preview

---

# Settings Module

## Company Settings

Required Fields:

* Company Name
* Logo
* Address
* Mobile Number
* Email
* GST Number
* Registration Number

---

## Interest Settings

Manage:

* Manual Interest
* Slab Interest
* LTV Interest Slab

---

## Number Series Settings

Auto Generate:

* Customer ID
* Loan Number
* Mortgage Number
* Receipt Number

---

## User Settings

* User Management
* Role Management
* Permissions

---

## Theme Settings

* Light Mode
* Dark Mode
* Compact Layout
* Comfortable Layout

---

# Search Features

Global Search for:

* Customer
* Loan Number
* Mobile Number
* Mortgage Number
* Receipt Number

---

# Security Requirements

Mandatory:

* No LocalStorage for Business Data
* Use TiDB/MySQL Database Only
* Prisma ORM
* Encrypted Passwords
* Secure API Validation
* Role-Based Permissions
* CSRF Protection
* SQL Injection Protection
* Rate Limiting
* Session Expiry
* Audit Logging

---

# Validation Rules

Required Fields Must Be Enforced For:

* Customer Name
* Mobile Number
* Aadhaar Number
* Loan Amount
* Interest Type
* Loan Date
* Collection Amount
* Account Name

Other optional fields can remain flexible.

---

# Final Requirement

Build a production-ready finance management software that resembles modern banking and loan management systems.

The platform should focus on:

* Mortgage Loan Management
* Normal Loan Management
* Manual Interest Calculation
* Slab Interest Management
* LTV Interest Slab Management
* Collection Tracking
* Finance Accounting
* Reporting
* Security
* Audit Compliance

Do not generate demo/sample business data automatically.

All dashboard statistics, reports, charts, and tables must be generated only from actual user-entered database records stored in TiDB/MySQL through Prisma.
