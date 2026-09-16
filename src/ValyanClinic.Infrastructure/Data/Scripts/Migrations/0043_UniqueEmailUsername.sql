-- =============================================================================
-- Migrare 0043: Unicitate globala pentru Email si Username
--
-- SP-ul de login cauta cu WHERE (Email = @Email OR Username = @Email) si fara
-- filtru de clinica, deci doua randuri care se potrivesc fac autentificarea
-- nedeterminista: QueryFirstOrDefault alege arbitrar. Constrangerea existenta
-- UQ_Users_Email_Clinic garanta unicitatea doar in interiorul unei clinici.
--
-- Indecsii sunt filtrati pe IsDeleted = 0, ca un utilizator sters sa nu blocheze
-- refolosirea adresei.
-- =============================================================================

-- Verificare preliminara: migrarea esueaza explicit daca datele existente
-- incalca deja unicitatea, in loc sa cada cu o eroare de index greu de citit.
IF EXISTS (
    SELECT 1 FROM Users WHERE IsDeleted = 0 GROUP BY Email HAVING COUNT(*) > 1
)
BEGIN
    ;THROW 51000, N'Exista adrese de email duplicate intre utilizatorii activi. Rezolvati-le inainte de a rula aceasta migrare.', 1;
END;
GO

IF EXISTS (
    SELECT 1 FROM Users WHERE IsDeleted = 0 AND Username IS NOT NULL
    GROUP BY Username HAVING COUNT(*) > 1
)
BEGIN
    ;THROW 51001, N'Exista username-uri duplicate intre utilizatorii activi. Rezolvati-le inainte de a rula aceasta migrare.', 1;
END;
GO

IF EXISTS (
    SELECT 1 FROM Users u
    WHERE u.IsDeleted = 0 AND u.Username IS NOT NULL
      AND EXISTS (SELECT 1 FROM Users o
                  WHERE o.IsDeleted = 0 AND o.Id <> u.Id AND o.Email = u.Username)
)
BEGIN
    ;THROW 51002, N'Exista utilizatori al caror username coincide cu emailul altui utilizator. Rezolvati-le inainte de a rula aceasta migrare.', 1;
END;
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes
               WHERE name = 'UQ_Users_Email_Global' AND object_id = OBJECT_ID('Users'))
BEGIN
    CREATE UNIQUE NONCLUSTERED INDEX UQ_Users_Email_Global
        ON Users (Email)
        WHERE IsDeleted = 0;

    PRINT 'Index unic UQ_Users_Email_Global creat.';
END;
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes
               WHERE name = 'UQ_Users_Username_Global' AND object_id = OBJECT_ID('Users'))
BEGIN
    CREATE UNIQUE NONCLUSTERED INDEX UQ_Users_Username_Global
        ON Users (Username)
        WHERE IsDeleted = 0 AND Username IS NOT NULL;

    PRINT 'Index unic UQ_Users_Username_Global creat.';
END;
GO

PRINT 'Migrarea 0043_UniqueEmailUsername finalizata cu succes.';
GO
