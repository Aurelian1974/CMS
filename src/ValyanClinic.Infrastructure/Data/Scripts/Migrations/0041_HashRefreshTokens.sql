-- =============================================================================
-- Migrare 0041: Stocarea refresh token-urilor ca hash SHA-256, nu in clar
--
-- Motiv: valoarea bruta a token-ului era stocata in RefreshTokens.Token. Un SQL
-- injection, un backup scurs sau accesul unui DBA insemnau preluare directa de
-- sesiuni active, fara a fi nevoie de parole. Token-urile au durata de 7 zile.
--
-- SHA-256 este suficient: token-ul are deja 64 de bytes de entropie generati
-- crypto-secure, deci nu are nevoie de un KDF lent ca BCrypt. Hash-ul hex are
-- 64 de caractere, iar indexul unic ramane la fel de eficient ca inainte.
--
-- ATENTIE: randurile existente se sterg. Hash-ul nu poate fi derivat retroactiv,
-- iar valorile in clar trebuie oricum eliminate. Toti utilizatorii sunt
-- delogati o singura data, la aplicarea acestei migrari.
-- Vezi DECIZII_ARHITECTURA_AUTH.md, decizia D2.
-- =============================================================================

-- 1. Golim tabela — token-urile existente nu pot fi migrate
DELETE FROM RefreshTokens;
GO

-- 2. Indexul vechi referea coloana Token, deci trebuie scos inainte de DROP COLUMN
IF EXISTS (SELECT 1 FROM sys.indexes
           WHERE name = 'IX_RefreshTokens_Token' AND object_id = OBJECT_ID('RefreshTokens'))
BEGIN
    DROP INDEX IX_RefreshTokens_Token ON RefreshTokens;
    PRINT 'Index IX_RefreshTokens_Token eliminat.';
END;
GO

-- 3. Eliminam coloanele cu valori in clar
IF COL_LENGTH('RefreshTokens', 'Token') IS NOT NULL
BEGIN
    ALTER TABLE RefreshTokens DROP COLUMN Token;
    PRINT 'Coloana Token eliminata.';
END;
GO

IF COL_LENGTH('RefreshTokens', 'ReplacedByToken') IS NOT NULL
BEGIN
    ALTER TABLE RefreshTokens DROP COLUMN ReplacedByToken;
    PRINT 'Coloana ReplacedByToken eliminata.';
END;
GO

-- 4. Coloanele noi. NOT NULL este sigur: tabela a fost golita la pasul 1.
IF COL_LENGTH('RefreshTokens', 'TokenHash') IS NULL
BEGIN
    ALTER TABLE RefreshTokens ADD TokenHash CHAR(64) NOT NULL;
    PRINT 'Coloana TokenHash adaugata.';
END;
GO

IF COL_LENGTH('RefreshTokens', 'ReplacedByTokenHash') IS NULL
BEGIN
    ALTER TABLE RefreshTokens ADD ReplacedByTokenHash CHAR(64) NULL;
    PRINT 'Coloana ReplacedByTokenHash adaugata.';
END;
GO

-- 5. Index unic pe hash — cautarea la /refresh + garantia de unicitate a token-ului
IF NOT EXISTS (SELECT 1 FROM sys.indexes
               WHERE name = 'UQ_RefreshTokens_TokenHash' AND object_id = OBJECT_ID('RefreshTokens'))
BEGIN
    CREATE UNIQUE NONCLUSTERED INDEX UQ_RefreshTokens_TokenHash
        ON RefreshTokens (TokenHash)
        INCLUDE (UserId, ExpiresAt, RevokedAt);

    PRINT 'Index unic UQ_RefreshTokens_TokenHash creat.';
END;
GO

-- 6. Index pentru cleanup-ul periodic al token-urilor expirate/revocate
IF NOT EXISTS (SELECT 1 FROM sys.indexes
               WHERE name = 'IX_RefreshTokens_ExpiresAt' AND object_id = OBJECT_ID('RefreshTokens'))
BEGIN
    CREATE NONCLUSTERED INDEX IX_RefreshTokens_ExpiresAt
        ON RefreshTokens (ExpiresAt);

    PRINT 'Index IX_RefreshTokens_ExpiresAt creat.';
END;
GO

PRINT 'Migrarea 0041_HashRefreshTokens finalizata cu succes.';
GO
