CREATE DATABASE IF NOT EXISTS property_management_app
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE property_management_app;

SET FOREIGN_KEY_CHECKS = 0;

DROP TABLE IF EXISTS RentPayments;
DROP TABLE IF EXISTS WorkLogs;
DROP TABLE IF EXISTS Invoices;
DROP TABLE IF EXISTS RentSchedules;
DROP TABLE IF EXISTS Tenants;
DROP TABLE IF EXISTS AuthUsers;
DROP TABLE IF EXISTS MaintenanceProjects;
DROP TABLE IF EXISTS Properties;

SET FOREIGN_KEY_CHECKS = 1;

CREATE TABLE AuthUsers (
    AuthUserId INT NOT NULL AUTO_INCREMENT,
    Email VARCHAR(200) NOT NULL,
    PasswordHash VARCHAR(500) NOT NULL,
    RoleName ENUM('Admin', 'Contractor', 'Landlord', 'Tenant') NOT NULL,
    IsActive BOOLEAN NOT NULL DEFAULT TRUE,
    CreatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UpdatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (AuthUserId),
    CONSTRAINT UX_AuthUsers_Email UNIQUE (Email)
);

CREATE TABLE Properties (
    PropertyId INT NOT NULL AUTO_INCREMENT,
    PropertyName VARCHAR(150) NOT NULL,
    AddressLine1 VARCHAR(200) NOT NULL,
    UnitNumber VARCHAR(50) NULL,
    MonthlyRent DECIMAL(10, 2) NOT NULL,
    OccupancyStatus ENUM('occupied', 'vacant', 'maintenance') NOT NULL DEFAULT 'vacant',
    CreatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UpdatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (PropertyId)
);

CREATE TABLE Tenants (
    TenantId INT NOT NULL AUTO_INCREMENT,
    AuthUserId INT NULL,
    FirstName VARCHAR(100) NOT NULL,
    LastName VARCHAR(100) NOT NULL,
    Email VARCHAR(200) NOT NULL,
    PhoneNumber VARCHAR(25) NOT NULL,
    PropertyId INT NOT NULL,
    LeaseStartDate DATE NULL,
    LeaseEndDate DATE NULL,
    TenantStatus ENUM('active', 'past_due', 'former', 'applicant') NOT NULL DEFAULT 'active',
    CreatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UpdatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (TenantId),
    CONSTRAINT FK_Tenants_AuthUsers
        FOREIGN KEY (AuthUserId) REFERENCES AuthUsers (AuthUserId)
        ON DELETE SET NULL
        ON UPDATE CASCADE,
    CONSTRAINT FK_Tenants_Properties
        FOREIGN KEY (PropertyId) REFERENCES Properties (PropertyId)
        ON DELETE RESTRICT
        ON UPDATE CASCADE
);

CREATE TABLE RentSchedules (
    ScheduleId INT NOT NULL AUTO_INCREMENT,
    TenantId INT NOT NULL,
    DueDate DATE NOT NULL,
    ScheduleStatus ENUM('Paid', 'Unpaid', 'Partial', 'Late') NOT NULL,
    BaseRent DECIMAL(10, 2) NOT NULL,
    LateFeeAmount DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    BalanceDue DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    ReminderCount INT NOT NULL DEFAULT 0,
    CreatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UpdatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (ScheduleId),
    CONSTRAINT FK_RentSchedules_Tenants
        FOREIGN KEY (TenantId) REFERENCES Tenants (TenantId)
        ON DELETE RESTRICT
        ON UPDATE CASCADE
);

CREATE TABLE RentPayments (
    PaymentId INT NOT NULL AUTO_INCREMENT,
    ScheduleId INT NOT NULL,
    AmountPaid DECIMAL(10, 2) NOT NULL,
    PaymentMethod ENUM('ACH', 'Card', 'Cash', 'Check') NOT NULL,
    PaymentDate DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    ReferenceNumber VARCHAR(100) NULL,
    CreatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (PaymentId),
    CONSTRAINT FK_RentPayments_RentSchedules
        FOREIGN KEY (ScheduleId) REFERENCES RentSchedules (ScheduleId)
        ON DELETE RESTRICT
        ON UPDATE CASCADE
);

CREATE TABLE MaintenanceProjects (
    ProjectId INT NOT NULL AUTO_INCREMENT,
    PropertyId INT NOT NULL,
    ProjectTitle VARCHAR(200) NOT NULL,
    ProjectDescription TEXT NULL,
    BidAmount DECIMAL(10, 2) NULL,
    ProjectStatus ENUM('Bid', 'Approved', 'Work Order', 'Invoiced', 'Closed') NOT NULL,
    AssignedVendor VARCHAR(150) NULL,
    CreatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UpdatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (ProjectId),
    CONSTRAINT FK_MaintenanceProjects_Properties
        FOREIGN KEY (PropertyId) REFERENCES Properties (PropertyId)
        ON DELETE RESTRICT
        ON UPDATE CASCADE
);

CREATE TABLE WorkLogs (
    WorkLogId INT NOT NULL AUTO_INCREMENT,
    ProjectId INT NOT NULL,
    ClockInTime DATETIME NOT NULL,
    ClockOutTime DATETIME NULL,
    GPSLocation VARCHAR(100) NULL,
    ProofPhotoUrl VARCHAR(255) NULL,
    WorkNotes TEXT NULL,
    CreatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (WorkLogId),
    CONSTRAINT FK_WorkLogs_MaintenanceProjects
        FOREIGN KEY (ProjectId) REFERENCES MaintenanceProjects (ProjectId)
        ON DELETE CASCADE
        ON UPDATE CASCADE
);

CREATE TABLE Invoices (
    InvoiceId INT NOT NULL AUTO_INCREMENT,
    ProjectId INT NOT NULL,
    TotalAmount DECIMAL(10, 2) NOT NULL,
    InvoiceStatus ENUM('Draft', 'Sent', 'Paid', 'Overdue') NOT NULL DEFAULT 'Draft',
    IssuedOn DATE NULL,
    PaidOn DATE NULL,
    IsExported BOOLEAN NOT NULL DEFAULT FALSE,
    CreatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UpdatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (InvoiceId),
    CONSTRAINT FK_Invoices_MaintenanceProjects
        FOREIGN KEY (ProjectId) REFERENCES MaintenanceProjects (ProjectId)
        ON DELETE RESTRICT
        ON UPDATE CASCADE
);

CREATE INDEX IX_Tenants_PropertyId ON Tenants (PropertyId);
CREATE UNIQUE INDEX IX_Tenants_AuthUserId ON Tenants (AuthUserId);
CREATE INDEX IX_RentSchedules_TenantId ON RentSchedules (TenantId);
CREATE INDEX IX_RentSchedules_DueDate ON RentSchedules (DueDate);
CREATE INDEX IX_RentPayments_ScheduleId ON RentPayments (ScheduleId);
CREATE INDEX IX_MaintenanceProjects_PropertyId ON MaintenanceProjects (PropertyId);
CREATE INDEX IX_WorkLogs_ProjectId ON WorkLogs (ProjectId);
CREATE INDEX IX_Invoices_ProjectId ON Invoices (ProjectId);
