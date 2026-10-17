const normalize=value=>String(value).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLocaleLowerCase('es').trim();
export function matchingChoices(choices,query){const q=normalize(query);return choices.filter(item=>normalize(item.label).includes(q));}
