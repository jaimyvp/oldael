const path = require('path');
const express = require('express');
const expressLayouts = require('express-ejs-layouts');
const {
  getApartmentByCode,
  createCleaningActivity,
  getActivitiesWithinRange,
  getTotals,
} = require('./db');

const app = express();
const PORT = process.env.PORT || 3000;
const ACTIVITY_TYPES = [
  'REGULIERE_SCHOONMAAK',
  'OPLEVERINGSSCHOONMAAK',
  'KRANEN_DOORSPOELEN',
];

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.set('layout', 'layout');
app.use(express.urlencoded({ extended: true }));
app.use(expressLayouts);
app.use(express.static(path.join(__dirname, 'public')));

function formatDate(date) {
  return date.toISOString().slice(0, 10);
}

function getWeekRange(startDateParam) {
  const baseDate = startDateParam ? new Date(startDateParam) : new Date();
  if (Number.isNaN(baseDate.getTime())) {
    return getWeekRange(undefined);
  }

  const day = baseDate.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  const start = new Date(baseDate);
  start.setDate(baseDate.getDate() + diff);
  const end = new Date(start);
  end.setDate(start.getDate() + 6);

  return {
    start: formatDate(start),
    end: formatDate(end),
    startDateObj: start,
    endDateObj: end,
  };
}

app.locals.formatDisplayDate = (dateStr) => {
  const date = new Date(dateStr);
  if (Number.isNaN(date.getTime())) return dateStr;
  return date.toLocaleDateString('nl-NL', { year: 'numeric', month: 'short', day: 'numeric' });
};

app.get('/', (req, res) => {
  res.redirect('/register-cleaning');
});

app.get('/register-cleaning', (req, res) => {
  const { apartmentCode, success } = req.query;
  const trimmedCode = apartmentCode ? apartmentCode.trim() : '';
  const apartment = trimmedCode ? getApartmentByCode(trimmedCode) : null;

  res.render('register-cleaning', {
    apartment,
    apartmentCode: trimmedCode,
    activityTypes: ACTIVITY_TYPES,
    errors: [],
    success: success === '1',
    formValues: {
      date: formatDate(new Date()),
      activity_type: ACTIVITY_TYPES[0],
      cleaner_name: '',
      hours_worked: '',
    },
  });
});

app.post('/register-cleaning', (req, res) => {
  const { apartmentCode, activity_type, date, cleaner_name, hours_worked } = req.body;
  const errors = [];
  const trimmedCode = apartmentCode ? apartmentCode.trim() : '';
  const apartment = trimmedCode ? getApartmentByCode(trimmedCode) : null;

  if (!apartment) {
    errors.push('Ongeldige of ontbrekende apartmentCode.');
  }

  const activityType = activity_type;
  if (!ACTIVITY_TYPES.includes(activityType)) {
    errors.push('Selecteer een geldig type activiteit.');
  }

  const activityDate = date || formatDate(new Date());
  const parsedDate = new Date(activityDate);
  if (Number.isNaN(parsedDate.getTime())) {
    errors.push('Ongeldige datum.');
  }

  const cleanerName = cleaner_name ? cleaner_name.trim() : '';
  if (!cleanerName) {
    errors.push('Vul een naam of ID van de schoonmaker in.');
  }

  let hoursValue = null;
  if (activityType === 'OPLEVERINGSSCHOONMAAK') {
    const numericHours = Number(hours_worked);
    if (!hours_worked || Number.isNaN(numericHours) || numericHours <= 0) {
      errors.push('Voer het aantal gewerkte uren in voor een opleveringsschoonmaak.');
    } else {
      hoursValue = numericHours;
    }
  }

  if (errors.length > 0) {
    return res.status(400).render('register-cleaning', {
      apartment,
      apartmentCode: trimmedCode,
      activityTypes: ACTIVITY_TYPES,
      errors,
      success: false,
      formValues: {
        date,
        activity_type,
        cleaner_name,
        hours_worked,
      },
    });
  }

  createCleaningActivity({
    apartmentId: apartment.id,
    activityType,
    date: activityDate,
    cleanerName,
    hoursWorked: hoursValue,
  });

  return res.redirect(`/register-cleaning?apartmentCode=${encodeURIComponent(trimmedCode)}&success=1`);
});

app.get('/weekly-overview', (req, res, next) => {
  try {
    const { startDate } = req.query;
    const range = getWeekRange(startDate);

    const activities = getActivitiesWithinRange(range.start, range.end);
    const totals = getTotals(range.start, range.end);

    res.render('weekly-overview', {
      activities,
      totals,
      filters: { startDate: range.start },
      range,
    });
  } catch (error) {
    next(error);
  }
});

app.use((err, req, res, _next) => {
  // eslint-disable-next-line no-console
  console.error(err);
  res.status(500).send('Er ging iets mis. Probeer het later opnieuw.');
});

app.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`Server running on http://localhost:${PORT}`);
});
