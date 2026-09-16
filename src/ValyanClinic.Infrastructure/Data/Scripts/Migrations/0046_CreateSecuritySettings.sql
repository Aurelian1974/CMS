-- =============================================================================
-- Migrare 0046: Tabelele de setari de securitate
--
-- Valorile de mai jos erau pana acum constante in appsettings.json, deci se puteau
-- schimba doar prin redeploy. Le mutam in baza de date ca sa fie administrabile
-- dintr-un ecran.
--
-- Seed-ul reproduce exact valorile din appsettings.json de azi: aplicarea acestei
-- migrari nu trebuie sa schimbe niciun comportament.
--
-- Raman in appsettings.json, intentionat: Jwt:Secret, Jwt:Issuer, Jwt:Audience,
-- connection string-ul (secrete sau identitate criptografica), Security:BcryptWorkFactor
-- (schimba costul fiecarei autentificari, nu e o setare de formular) si
-- Jwt:AccessTokenExpiryMinutes (granularitatea observarii inactivitatii, nu o
-- setare de business — vezi PLAN_SETARI_SECURITATE.md).
-- =============================================================================

IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'SecuritySettings')
BEGIN
    CREATE TABLE dbo.SecuritySettings (
        -- Tabela are un singur rand. Cheia fixa il garanteaza: nu se pot acumula
        -- configuratii concurente din care sa nu stim care e cea activa.
        Id                           TINYINT       NOT NULL PRIMARY KEY DEFAULT 1,

        -- ===== Politica de parole (consumata incepand cu Etapa 2) =====
        PasswordMinLength            INT           NOT NULL DEFAULT 12,
        PasswordMaxLength            INT           NOT NULL DEFAULT 100,
        PasswordMinDigits            INT           NOT NULL DEFAULT 0,
        PasswordMinSpecial           INT           NOT NULL DEFAULT 0,
        PasswordMinUppercase         INT           NOT NULL DEFAULT 0,
        PasswordMinLowercase         INT           NOT NULL DEFAULT 0,
        PasswordBlocklistEnabled     BIT           NOT NULL DEFAULT 1,
        PasswordForbidIdentityValues BIT           NOT NULL DEFAULT 1,
        PasswordHistoryCount         INT           NOT NULL DEFAULT 0,
        PasswordExpiryDays           INT           NOT NULL DEFAULT 0,

        -- ===== Blocarea contului =====
        MaxFailedLoginAttempts       INT           NOT NULL DEFAULT 5,
        LockoutMinutes               INT           NOT NULL DEFAULT 15,

        -- ===== Retentie =====
        SecurityEventRetentionDays   INT           NOT NULL DEFAULT 730,
        RefreshTokenRetentionDays    INT           NOT NULL DEFAULT 30,

        UpdatedAt                    DATETIME2     NULL,
        UpdatedBy                    UNIQUEIDENTIFIER NULL,

        CONSTRAINT CK_SecuritySettings_SingleRow CHECK (Id = 1)
    );

    INSERT INTO dbo.SecuritySettings (Id) VALUES (1);

    PRINT 'Tabelul SecuritySettings a fost creat si initializat.';
END;
GO

IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'RoleSecuritySettings')
BEGIN
    CREATE TABLE dbo.RoleSecuritySettings (
        RoleId             UNIQUEIDENTIFIER NOT NULL PRIMARY KEY,

        -- Fereastra de inactivitate dupa care sesiunea expira. Consumata din Etapa 3;
        -- pornim cu 30 de minute pentru toate rolurile.
        IdleTimeoutMinutes INT              NOT NULL DEFAULT 30,

        -- Cat timp poate fi reluata sesiunea fara reautentificare.
        -- Valoarea 7 reproduce Jwt:RefreshTokenExpiryDays de azi.
        RefreshTokenDays   INT              NOT NULL DEFAULT 7,

        UpdatedAt          DATETIME2        NULL,
        UpdatedBy          UNIQUEIDENTIFIER NULL,

        CONSTRAINT FK_RoleSecuritySettings_Roles FOREIGN KEY (RoleId) REFERENCES dbo.Roles(Id)
    );

    PRINT 'Tabelul RoleSecuritySettings a fost creat.';
END;
GO

-- Un rand pentru fiecare rol existent, cu valorile implicite.
-- Idempotent: rolurile adaugate ulterior primesc randul la urmatoarea rulare.
INSERT INTO dbo.RoleSecuritySettings (RoleId)
SELECT r.Id
FROM dbo.Roles r
WHERE NOT EXISTS (SELECT 1 FROM dbo.RoleSecuritySettings s WHERE s.RoleId = r.Id);
GO

PRINT 'Migrarea 0046_CreateSecuritySettings finalizata cu succes.';
GO
