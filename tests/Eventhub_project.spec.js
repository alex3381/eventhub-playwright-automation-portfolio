
import { test, expect } from '@playwright/test';

// ADDED FOR README SCREENSHOTS: imports Node's folder-creation function.
import { mkdirSync } from 'node:fs';

// ADDED FOR README SCREENSHOTS: creates docs/images automatically if it does not exist.
mkdirSync('docs/images', {
  recursive: true
});


const BASE_URL = 'https://eventhub.rahulshettyacademy.com';

const EMAIL = process.env.EVENTHUB_EMAIL;

const PASSWORD = process.env.EVENTHUB_PASSWORD;

const FULL_NAME =
  process.env.EVENTHUB_FULL_NAME || 'Daniel Shaun';

const PHONE =
  process.env.EVENTHUB_PHONE || '+91 98765 43210';


if (!EMAIL || !PASSWORD) {
  throw new Error(
    'Set EVENTHUB_EMAIL and EVENTHUB_PASSWORD before running the tests.'
  );
}


async function login(page) {
  await page.goto(`${BASE_URL}/login`);

  await page
    .getByPlaceholder('you@email.com')
    .fill(EMAIL);

  await page
    .getByLabel('Password')
    .fill(PASSWORD);

  await page
    .locator('#login-btn')
    .click();

  await expect(
    page.getByRole('link', {
      name: 'Browse Events →'
    })
  ).toBeVisible({
    timeout: 10000
  });

  console.log('Login successful');
}


function futureDateValue() {
  const date = new Date();

  date.setDate(date.getDate() + 7);

  const year = date.getFullYear();

  const month = String(
    date.getMonth() + 1
  ).padStart(2, '0');

  const day = String(
    date.getDate()
  ).padStart(2, '0');

  return `${year}-${month}-${day}T10:30`;
}


async function readSeatCount(eventCard) {
  const seatText = await eventCard
    .getByText(/\d+\s+seats?/i)
    .first()
    .innerText();

  const seatNumberMatch =
    seatText.match(/\d+/);

  if (!seatNumberMatch) {
    throw new Error(
      `Could not extract the seat count from: ${seatText}`
    );
  }

  const seatCount =
    Number(seatNumberMatch[0]);

  return seatCount;
}


async function completeBooking(page, quantity) {
  const ticketCount =
    page.locator('#ticket-count');

  await expect(ticketCount).toHaveText('1');

  if (quantity === 3) {
    const plusButton =
      page
        .locator('button:has-text("+")')
        .first();

    await plusButton.click();
    await plusButton.click();

    await expect(ticketCount).toHaveText('3');
  }

  console.log(
    'Ticket quantity:',
    await ticketCount.innerText()
  );

  await page
    .getByPlaceholder('your full name')
    .fill(FULL_NAME);

  await page
    .locator('#customer-email')
    .fill(EMAIL);

  await page
    .getByPlaceholder('+91 98765 43210')
    .fill(PHONE);

  await page
    .locator('.confirm-booking-btn')
    .click();

  const bookingReferenceElement =
    page.locator('.booking-ref').first();

  await expect(
    bookingReferenceElement
  ).toBeVisible({
    timeout: 10000
  });

  const bookingReference =
    (
      await bookingReferenceElement.innerText()
    ).trim();

  console.log(
    'Booking reference:',
    bookingReference
  );

  return bookingReference;
}


async function bookFirstEvent(page, quantity) {
  await page.goto(`${BASE_URL}/events`);

  const firstEventCard =
    page.getByTestId('event-card').first();

  await expect(
    firstEventCard
  ).toBeVisible({
    timeout: 10000
  });

  console.log(
    'Selected event:',
    await firstEventCard.innerText()
  );

  await firstEventCard
    .getByTestId('book-now-btn')
    .click();

  const bookingReference =
    await completeBooking(page, quantity);

  return bookingReference;
}


async function openBookingDetails(
  page,
  bookingReference
) {
  await page
    .getByRole('link', {
      name: 'View My Bookings'
    })
    .click();

  await expect(page).toHaveURL(
    `${BASE_URL}/bookings`
  );

  const bookingCards =
    page.locator('#booking-card');

  await expect(
    bookingCards.first()
  ).toBeVisible({
    timeout: 10000
  });

  const matchingBookingCard =
    bookingCards
      .filter({
        has: page.locator('.booking-ref', {
          hasText: bookingReference
        })
      })
      .first();

  await expect(
    matchingBookingCard
  ).toBeVisible({
    timeout: 5000
  });

  await matchingBookingCard
    .getByRole('link', {
      name: 'View Details'
    })
    .click();

  await expect(
    page.getByText(
      'Booking Information',
      {
        exact: true
      }
    )
  ).toBeVisible({
    timeout: 10000
  });

  const mainContent =
    page.locator('body main');

  await expect(
    mainContent
  ).toBeVisible({
    timeout: 5000
  });

  const bookingRefLocator =
    mainContent
      .getByText(/^[A-Z]-[A-Z0-9]+$/)
      .first();

  await expect(
    bookingRefLocator
  ).toBeVisible({
    timeout: 5000
  });

  const bookingRefOnDetailsPage =
    (
      await bookingRefLocator.innerText()
    ).trim();

  const eventTitle =
    (
      await page
        .locator('h1')
        .first()
        .innerText()
    ).trim();

  console.log(
    'Booking reference on details page:',
    bookingRefOnDetailsPage
  );

  console.log(
    'Event title:',
    eventTitle
  );

  expect(
    bookingRefOnDetailsPage
  ).toBe(
    bookingReference
  );

  expect(
    bookingRefOnDetailsPage
      .charAt(0)
      .toUpperCase()
  ).toBe(
    eventTitle
      .charAt(0)
      .toUpperCase()
  );

  console.log(
    'Booking reference validation passed'
  );

  return {
    bookingRefOnDetailsPage,
    eventTitle
  };
}


async function checkRefundEligibility(
  page,
  expectedStatus,
  expectedReason
) {
  const refundSpinner =
    page.locator('#refund-spinner');

  await page
    .locator('#check-refund-btn')
    .click();

  await expect(
    refundSpinner
  ).toBeVisible({
    timeout: 3000
  });

  console.log(
    'Refund spinner appeared'
  );

  await expect(
    refundSpinner
  ).toBeHidden({
    timeout: 6000
  });

  console.log(
    'Refund spinner disappeared'
  );

  const refundResult =
    page.locator('#refund-result');

  await expect(
    refundResult
  ).toBeVisible({
    timeout: 6000
  });

  await expect(
    refundResult
  ).toContainText(
    expectedStatus
  );

  await expect(
    refundResult
  ).toContainText(
    expectedReason
  );

  console.log(
    'Refund result:',
    await refundResult.innerText()
  );
}


test(
  'Create event, book one ticket, and verify seat reduction',
  async ({ page }) => {

    test.setTimeout(60000);

    await login(page);

    const eventTitle =
      `Test Event ${Date.now()}`;

    const eventDescription =
      'A practical EventHub booking test created with Playwright.';

    const eventPrice = '100';
    const totalSeats = '50';

    const eventVenue =
      'Madison Square Garden, 4 Pennsylvania Plaza, New York, NY 10001, USA';

    const eventCity =
      'New York';

    // ADDED CONFERENCE BANNER IMAGE:
    // Conference-stage image used as the event banner.
    const eventImageUrl =
      'https://upload.wikimedia.org/wikipedia/commons/thumb/9/91/OMR19_Conference_Stage.jpg/960px-OMR19_Conference_Stage.jpg';


    await page.goto(
      `${BASE_URL}/admin/events`
    );

    await page
      .locator('#event-title-input')
      .fill(eventTitle);

    await page
      .locator(
        '#admin-event-form textarea'
      )
      .fill(eventDescription);

    await page
      .getByLabel('City')
      .fill(eventCity);

    await page
      .getByLabel('Venue')
      .fill(eventVenue);

    await page
      .getByLabel(
        'Event Date & Time'
      )
      .fill(futureDateValue());

    await page
      .getByLabel('Price ($)')
      .fill(eventPrice);

    await page
      .getByLabel('Total Seats')
      .fill(totalSeats);

    // ADDED CONFERENCE BANNER IMAGE:
    // Enters the conference image URL in the optional banner field.
    await page
      .getByRole('textbox', {
        name: 'Image URL (optional)'
      })
      .fill(eventImageUrl);

    await page
      .locator('#add-event-btn')
      .click();

    await expect(
      page.getByText(
        'Event created!',
        {
          exact: true
        }
      )
    ).toBeVisible({
      timeout: 5000
    });

    // ADDED FOR README SCREENSHOT: captures the page while the event-created message is visible.
    await page.screenshot({
      path: 'docs/images/01-event-created.png',
      fullPage: true,
      animations: 'disabled',
      mask: [
        page.getByTestId('user-email-display')
      ]
    });

    console.log(
      'Event created:',
      eventTitle
    );


    await page.goto(
      `${BASE_URL}/events`
    );

    const eventCards =
      page.getByTestId('event-card');

    await expect(
      eventCards.first()
    ).toBeVisible({
      timeout: 10000
    });

    const createdEventCard =
      eventCards
        .filter({
          hasText: eventTitle
        })
        .first();

    await expect(
      createdEventCard
    ).toBeVisible({
      timeout: 5000
    });

    // ADDED CONFERENCE BANNER IMAGE:
    // Waits until the remote banner has loaded before taking the screenshot.
    const eventBanner = createdEventCard
      .locator('img')
      .first();

    await expect.poll(
      async () => eventBanner.evaluate(
        image => image.complete && image.naturalWidth > 0
      ),
      {
        timeout: 10000
      }
    ).toBe(true);

    // ADDED FOR README SCREENSHOT: captures only the newly created event card before booking.
    await createdEventCard.scrollIntoViewIfNeeded();

    // ADDED FOR README SCREENSHOT: saves a focused image of the new event card.
    await createdEventCard.screenshot({
      path: 'docs/images/02-created-event-card-before-booking.png',
      animations: 'disabled'
    });

    const seatsBeforeBooking =
      await readSeatCount(
        createdEventCard
      );

    console.log(
      'Seats before booking:',
      seatsBeforeBooking
    );


    await createdEventCard
      .getByTestId('book-now-btn')
      .click();

    const bookingReference =
      await completeBooking(page, 1);

    // ADDED FOR README SCREENSHOT: captures the booking confirmation page and booking reference.
    await page.screenshot({
      path: 'docs/images/03-booking-confirmation.png',
      fullPage: true,
      animations: 'disabled',
      mask: [
        page.getByTestId('user-email-display')
      ]
    });


    await page
      .getByRole('link', {
        name: 'View My Bookings'
      })
      .click();

    await expect(page).toHaveURL(
      `${BASE_URL}/bookings`
    );

    const bookingCards =
      page.locator('#booking-card');

    await expect(
      bookingCards.first()
    ).toBeVisible({
      timeout: 10000
    });

    const matchingBookingCard =
      bookingCards
        .filter({
          has: page.locator(
            '.booking-ref',
            {
              hasText:
                bookingReference
            }
          )
        })
        .first();

    await expect(
      matchingBookingCard
    ).toBeVisible({
      timeout: 5000
    });

    await expect(
      matchingBookingCard
    ).toContainText(eventTitle);

    // ADDED FOR README SCREENSHOT: moves the matching booking card into view.
    await matchingBookingCard.scrollIntoViewIfNeeded();

    // ADDED FOR README SCREENSHOT: captures the verified booking in My Bookings.
    await matchingBookingCard.screenshot({
      path: 'docs/images/04-my-bookings-card.png',
      animations: 'disabled'
    });

    console.log(
      'Booking found in My Bookings'
    );


    await page.goto(
      `${BASE_URL}/events`
    );

    const eventCardsAfterBooking =
      page.getByTestId('event-card');

    await expect(
      eventCardsAfterBooking.first()
    ).toBeVisible({
      timeout: 10000
    });

    const createdEventCardAfterBooking =
      eventCardsAfterBooking
        .filter({
          hasText: eventTitle
        })
        .first();

    await expect(
      createdEventCardAfterBooking
    ).toBeVisible({
      timeout: 5000
    });

    const seatsAfterBooking =
      await readSeatCount(
        createdEventCardAfterBooking
      );

    console.log(
      'Seats after booking:',
      seatsAfterBooking
    );

    // ADDED FOR README SCREENSHOT: captures the event card after the seat count has reduced.
    await createdEventCardAfterBooking.scrollIntoViewIfNeeded();

    // ADDED FOR README SCREENSHOT: saves evidence of the updated seat count.
    await createdEventCardAfterBooking.screenshot({
      path: 'docs/images/05-event-card-after-booking.png',
      animations: 'disabled'
    });

    expect(
      seatsAfterBooking
    ).toBe(
      seatsBeforeBooking - 1
    );

    console.log(
      `Test passed: seats reduced from ${seatsBeforeBooking} to ${seatsAfterBooking}`
    );
  }
);


test(
  'Single-ticket booking is eligible for refund',
  async ({ page }) => {

    test.setTimeout(60000);

    await login(page);

    const bookingReference =
      await bookFirstEvent(
        page,
        1
      );

    const bookingDetails =
      await openBookingDetails(
        page,
        bookingReference
      );

    await checkRefundEligibility(
      page,
      'Eligible for refund',
      'Single-ticket bookings qualify for a full refund'
    );

    // ADDED FOR README SCREENSHOT: captures the successful single-ticket refund result.
    await page.locator('#refund-result').screenshot({
      path: 'docs/images/06-single-ticket-refund-result.png',
      animations: 'disabled'
    });

    console.log({
      bookingReference:
        bookingDetails.bookingRefOnDetailsPage,
      eventTitle:
        bookingDetails.eventTitle,
      refundStatus:
        'Eligible for refund'
    });
  }
);


test(
  'Three-ticket group booking is not eligible for refund',
  async ({ page }) => {

    test.setTimeout(60000);

    await login(page);

    const bookingReference =
      await bookFirstEvent(
        page,
        3
      );

    const bookingDetails =
      await openBookingDetails(
        page,
        bookingReference
      );

    await checkRefundEligibility(
      page,
      'Not eligible for refund',
      'Group bookings (3 tickets) are non-refundable'
    );

    // ADDED FOR README SCREENSHOT: captures the non-refundable three-ticket result.
    await page.locator('#refund-result').screenshot({
      path: 'docs/images/07-group-ticket-refund-result.png',
      animations: 'disabled'
    });

    console.log({
      bookingReference:
        bookingDetails.bookingRefOnDetailsPage,
      eventTitle:
        bookingDetails.eventTitle,
      refundStatus:
        'Not eligible for refund'
    });
  }
);