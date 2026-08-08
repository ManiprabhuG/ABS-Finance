# Finance.md

# ABS Finance Management Software - Dashboard Development Instructions

## Project Overview

Build a complete enterprise-grade Finance Management Dashboard for **ABS Finance Management Software**.

The system is used for managing:

- Mortgage Loans
- Normal Loans (NRML Loans)
- Manual Interest Rate Management
- Interest Slab Management
- LTV (Loan-to-Value) Interest Slab Management
- Loan Collections
- Finance & Accounting
- Customer Management
- Reports & Analytics

The application must follow real-world NBFC (Non-Banking Financial Company) and Financial Institution standards.

---

# Core Objectives

Create a:

- Professional Dashboard
- Secure System
- Fast Performance
- Fully Responsive Design
- Multi-user Role-Based System
- Real-Time Database Driven Platform
- Light & Dark Mode Support
- Enterprise-Level UI/UX

Avoid demo-style templates.

Build a real-world finance management platform.

---

# Recommended Tech Stack

## Frontend

- Next.js 15+
- React 19+
- TypeScript
- Tailwind CSS
- Shadcn UI
- React Hook Form
- Zod Validation
- TanStack Query

## Backend

- Node.js
- Next.js Server Actions / API Routes
- TypeScript

## Database

- TiDB Cloud
- MySQL Compatible Schema
- Prisma ORM

## Authentication

- JWT Authentication
- Role Based Access Control (RBAC)
- Secure Session Management

## Security

- Password Hashing
- Input Validation
- API Protection
- SQL Injection Prevention
- XSS Protection
- CSRF Protection
- Audit Logs

---

# Design Guidelines

## Theme

Professional Financial Institution Theme

### Primary Colors

- Finance Blue
- Navy Blue
- White
- Light Gray

### Accent Colors

- Emerald Green
- Gold
- Soft Cyan

### Status Colors

- Success → Green
- Warning → Orange
- Danger → Red
- Info → Blue

---

# UI Requirements

## Dashboard Layout

### Left Sidebar

- Dashboard
- Customer Management
- Loan Management
- Collection Management
- Finance & Accounts
- Reports
- Settings
- Audit Logs
- User Management

### Top Navigation

- Search
- Notifications
- User Profile
- Theme Toggle
- Branch Selector
- Logout

---

# Authentication Module

## Login Page

Professional Login Page

Required Fields:

- Username
- Password

Features:

- Remember Session
- Forgot Password
- Secure Login Validation
- Session Timeout
- Device Tracking

---

# User Role Management

## Roles

### Super Admin

Full Access

### Admin

Manage all modules except Super Admin settings

### Accountant

Finance & Reports

### Collection Officer

Collections & Customer Follow-ups

### Loan Officer

Loan Processing

### Viewer

Read Only Access

---

# Dashboard Home

## Dashboard Cards

Show:

- Total Customers
- Active Loans
- Closed Loans
- Pending Loans
- Overdue Loans
- Today's Collection
- Monthly Collection
- Total Outstanding
- Total Mortgage Value
- Cash In Hand
- Bank Balance
- Total Income
- Total Expense

---

# Customer Management

## Customer Master

CRUD Required

### Required Fields

- Customer ID (Auto Generate)
- Customer Name
- Mobile Number
- Aadhaar Number
- Address

### Optional Fields

- Email
- PAN Number
- Occupation
- Nominee Details
- Photo Upload
- Remarks

### Features

- Customer Search
- Customer Timeline
- Customer Documents
- Customer Ledger
- Loan History

---

# Loan Management

CRUD Required

## Loan Types

### Mortgage Loan

### Normal Loan

### Custom Loan

Admin can create additional loan types.

---

## Loan Creation Form

### Required Fields

- Loan Number (Auto Generate)
- Customer
- Loan Type
- Principal Amount
- Interest Type
- Interest Rate
- Loan Date
- Loan Status

### Optional Fields

- Notes
- Documents
- Collateral Information

---

# Mortgage Details

Required:

- Asset Type
- Asset Description
- Asset Value
- Market Value
- LTV Percentage

---

# Interest Management

## Interest Types

### Flat Interest

### Reducing Interest

### Manual Interest

Admin can create more.

---

# Interest Slab Management

CRUD Required

Fields:

- Slab Name
- From Amount
- To Amount
- Interest Rate
- Status

---

# LTV Interest Slab Management

CRUD Required

Fields:

- LTV Range
- Interest Percentage
- Loan Category
- Active Status

Example:

| LTV Range | Interest |
|------------|-----------|
| 0-40% | 10% |
| 41-60% | 12% |
| 61-80% | 15% |

System must automatically suggest slab while creating loans.

---

# Collection Management

CRUD Required

## Collection Entry

Required Fields:

- Collection ID
- Customer
- Loan
- Collection Date
- Amount Received
- Payment Mode

### Payment Modes

- Cash
- Bank Transfer
- UPI
- Cheque

---

# Collection Features

- EMI Collection
- Partial Collection
- Advance Collection
- Penalty Collection
- Overdue Collection
- Receipt Printing
- Collection History
- Collection Ledger

---

# Finance & Accounts Management

This is the most important module.

Every payment-related page must automatically update accounts and ledger books.

---

# Bank Account Management

CRUD Required

Fields:

- Account Name
- Account Number
- Bank Name
- Branch
- IFSC
- Opening Balance
- Current Balance
- Status

---

# Cash In Hand Account

System Default Account

Track:

- Cash Collections
- Cash Expenses
- Cash Transfers

---

# Central Ledger Book

Create one master ledger engine.

All transactions from:

- Loan Disbursement
- Collection Entry
- Income Entry
- Expense Entry
- Bank Transfer
- Adjustment Entry

must automatically create ledger entries.

No manual duplicate entries.

---

# Ledger Entry Structure

Fields:

- Ledger ID
- Date
- Transaction Type
- Reference Number
- Debit
- Credit
- Balance
- Remarks

---

# Loan Disbursement

When loan is approved:

Automatically:

- Reduce Bank Balance
OR
- Reduce Cash In Hand

Generate Ledger Entry.

---

# Income Management

CRUD Required

Examples:

- Processing Fee
- Documentation Fee
- Service Charges
- Other Income

Auto Ledger Posting Required.

---

# Expense Management

CRUD Required

Examples:

- Office Rent
- Salary
- Electricity
- Maintenance
- Misc Expense

Auto Ledger Posting Required.

---

# Fund Transfer

CRUD Required

Transfer Between:

- Bank To Bank
- Bank To Cash
- Cash To Bank

Auto Ledger Posting Required.

---

# Reports Module

## Financial Reports

Generate:

- Ledger Report
- Trial Balance
- Cash Book
- Bank Book
- Day Book
- Income Report
- Expense Report
- Profit & Loss
- Collection Report
- Loan Outstanding Report

---

## Customer Reports

- Customer Ledger
- Customer Summary
- Loan History
- Active Loans
- Closed Loans

---

## Collection Reports

- Daily Collection
- Monthly Collection
- Overdue Collection
- Officer Collection Report

---

## Loan Reports

- Loan Register
- Mortgage Report
- Interest Slab Report
- LTV Report

---

# Analytics Dashboard

Charts Required

- Collection Trend
- Loan Growth
- Interest Income
- Customer Growth
- Loan Type Distribution
- Bank Balance Trend

---

# Notification Center

Send Alerts For:

- Due Collections
- Overdue Loans
- New Customer
- New Loan
- Approval Pending
- Low Cash Balance

---

# Document Management

Store:

- Aadhaar
- PAN
- Property Documents
- Loan Agreements
- Mortgage Documents
- Customer Photos

---

# Settings Module

## Company Settings

- Company Name
- Logo
- Address
- GST Number
- Contact Details

---

## Loan Settings

- Loan Number Prefix
- Interest Defaults
- Penalty Settings
- Grace Period

---

## Collection Settings

- Receipt Prefix
- SMS Template
- Reminder Settings

---

## Finance Settings

- Financial Year
- Default Ledger
- Default Bank Account
- Currency

---

# Audit Log System

Track:

- Create
- Update
- Delete
- Login
- Logout
- Approval Activities

Store:

- User
- Time
- Module
- Action
- IP Address

---

# CRUD Requirements

The following modules must support:

Create
Read
Update
Delete

Modules:

- Customers
- Loans
- Collections
- Bank Accounts
- Income
- Expense
- Fund Transfer
- Interest Slabs
- LTV Slabs
- Users
- Roles
- Settings

---

# Form Validation Rules

Do NOT make all fields optional.

Important fields must be required.

Examples:

Required:

- Customer Name
- Mobile Number
- Loan Amount
- Loan Type
- Interest Rate
- Collection Amount
- Payment Mode
- Bank Name
- Account Number

Optional:

- Remarks
- Notes
- Additional Documents

Use proper validation and error messages.

---

# Database Requirements

Use TiDB Cloud.

Do NOT use:

- LocalStorage
- Mock Database
- Browser Storage

Everything must be stored in TiDB Database.

Implement:

- Foreign Keys
- Proper Relations
- Index Optimization
- Transaction Safety
- Soft Delete System

---

# Additional Professional Features

- Global Search
- Export PDF
- Export Excel
- Advanced Filters
- Pagination
- Bulk Import
- Bulk Export
- Dashboard Widgets
- Multi Branch Ready Architecture
- Mobile Responsive Design
- Tablet Responsive Design
- Desktop Responsive Design
- Print Friendly Reports
- Receipt Templates
- Dark Mode
- Light Mode

---

# Final Requirement

Build a production-ready finance management software with real-world accounting workflow.

Every loan, collection, income, expense, bank transfer and financial transaction must be interconnected with the Central Ledger Book and Bank/Cash balances automatically.

The system must be scalable, secure, professional, responsive and suitable for daily use by finance companies, loan providers and mortgage institutions.