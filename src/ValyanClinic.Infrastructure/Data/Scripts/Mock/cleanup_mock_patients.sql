-- =============================================================================
-- CLEANUP MOCK: Șterge cei 10.000 de pacienți de test
--
-- Rulează DOAR după ce testarea s-a terminat și ai confirmat că funcționează.
-- Marker de identificare: Notes = '##MOCK_TEST##'
-- =============================================================================

SET NOCOUNT ON;
GO

DECLARE @CountBefore INT = (SELECT COUNT(*) FROM Patients WHERE Notes = N'##MOCK_TEST##');
PRINT 'Pacienti mock inainte de cleanup: ' + CAST(@CountBefore AS NVARCHAR(10));

DELETE FROM Patients WHERE Notes = N'##MOCK_TEST##';

DECLARE @CountAfter INT = (SELECT COUNT(*) FROM Patients WHERE Notes = N'##MOCK_TEST##');
PRINT 'Pacienti mock ramasi dupa cleanup: ' + CAST(@CountAfter AS NVARCHAR(10));
PRINT 'Stersi: ' + CAST(@CountBefore - @CountAfter AS NVARCHAR(10));
SELECT COUNT(*) AS TotalPacientiReali FROM Patients;
GO
