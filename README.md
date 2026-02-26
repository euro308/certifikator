# Certifikátor

Certifikátor je webová aplikace vytvořená pro snadnější tvorbu, hromadné generování a rozesílání certifikátů. Výsledné
dokumenty se pak dají jednoduše a veřejně ověřit.

Projekt byl navržen tak, aby pokryl vše od počátečního designu šablony, přes propojení s daty (například jmény
účastníků), až po samotné odeslání do e-mailových schránek a garanci toho, že certifikát nelze padělat.

## Funkce aplikace

### 1. Editor šablon

Certifikátor disponuje vizuálním editorem šablon, který umožňuje vkládat texty, tvary nebo obrázky. Prvkům lze měnit
barvy, písmo a pozice. Hlavní funkcí editoru je, že si do šablony uživatel vloží proměnné, díky kterým se následně
vygeneruje certifikát.

### 2. Hromadné generování z dat

Po tvorbě šablony přichází na řadu generování certifikátů. Stačí nahrát soubor v jednom z podporovaných formátů (.xlsx,
.xls, .csv) a systém sám spáruje sloupečky v tabulce s proměnnými v šabloně, čímž vygeneruje hotové certifikáty.

### 3. Automatické rozesílání e-mailů

Vygenerované certifikáty umí systém rozeslat lidem na jejich e-mailové adresy. Díky propojením se službou Resend je tato
akce rychlá a spolehlivá. V případě nutnosti lze však také nově vygenerované certifikáty uložit do počítače a uživatel
je držitelům může odeslat manuálně.

### 4. Ověřování pravosti

Každý vygenerovaný certifikát má svůj unikátní kód, podle kterého lze ověřit jeho originalitu. Na validační stránce si
držitel certifikátu může kdykoliv ověřit, zda byl jeho certifikát opravdu vydán Certifikátorem.

### 5. Galerie a oblíbené

Hotové šablony se uživateli ukládají do jeho osobní galerie. Zároveň však projekt disponuje i veřejnou galerií, kam
mohou uživatelé publikovat své šablony pro využití ostatními. Ty nejlepší si lze snadno přidat do oblíbených, aby je
uživatel měl vždycky po ruce.