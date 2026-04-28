use property_management_app;
CREATE TABLE SharedDocuments (
    DocumentId      INT             NOT NULL AUTO_INCREMENT,
    TenantId        INT             NOT NULL,
    FileName        VARCHAR(255)    NOT NULL,
    FilePath        VARCHAR(1000)   NOT NULL,
    MimeType        VARCHAR(100)    NOT NULL,
    FileSizeBytes   BIGINT          NOT NULL,
    UploadedByRole  VARCHAR(50)     NOT NULL,
    UploadedByUserId INT            NOT NULL,
    Description     VARCHAR(500)    NULL,
    UploadedAt      DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP(),

    PRIMARY KEY (DocumentId),
    CONSTRAINT fk_shareddocs_tenant FOREIGN KEY (TenantId) REFERENCES Tenants (TenantId)
);