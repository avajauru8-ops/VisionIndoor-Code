const fs = require('fs');

const file = 'C:\\Users\\Eber-ACS\\AndroidStudioProjects\\TotemPlayer\\app\\src\\main\\java\\com\\veerocket\\grandmidia\\MainActivity.java';
let content = fs.readFileSync(file, 'utf8');

const search = `            info.put("data_hora", dataHora);

                    }
        } catch (Exception e) {`;

const replace = `            info.put("data_hora", dataHora);

        } catch (Exception e) {`;

content = content.replace(search, replace);

// Let's also make sure we didn't accidentally delete the closing brace of `obterInformacoesTotem()`
// Wait, the original code had:
// info.put("data_hora", dataHora);
// } catch (Exception e) {
// So replacing the extra `}` with nothing is perfectly correct.

fs.writeFileSync(file, content, 'utf8');
console.log('Fixed extra brace in obterInformacoesTotem!');
