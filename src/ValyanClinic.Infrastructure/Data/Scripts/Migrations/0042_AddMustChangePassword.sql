-- =============================================================================
-- Migrare 0042: Coloana MustChangePassword pe Users
--
-- Setata la 1 cand un administrator reseteaza parola altcuiva: persoana respectiva
-- primeste o parola pe care administratorul o cunoaste, deci trebuie sa o schimbe
-- la urmatoarea autentificare. Flag-ul se stinge la prima schimbare facuta de
-- utilizator prin fluxul self-service.
-- Vezi DECIZII_ARHITECTURA_AUTH.md, decizia D4.
-- =============================================================================

IF COL_LENGTH('Users', 'MustChangePassword') IS NULL
BEGIN
    ALTER TABLE Users
        ADD MustChangePassword BIT NOT NULL
            CONSTRAINT DF_Users_MustChangePassword DEFAULT 0;

    PRINT 'Coloana MustChangePassword a fost adaugata la Users.';
END;
GO

PRINT 'Migrarea 0042_AddMustChangePassword finalizata cu succes.';
GO
