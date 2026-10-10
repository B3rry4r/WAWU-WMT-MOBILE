import { fireEvent, render, screen } from '@testing-library/react-native';
import { useState } from 'react';

import { TicketStepper } from '../TicketStepper';

/**
 * No screen draws the quantity stepper today (R-47): EVENTS-06 builds Get tickets and draws the stepper, the
 * running total and that button together on E2. Until then it is a component that only does what it is handed,
 * so it is pinned here, apart from any screen.
 */
function Held({ max, start = 1 }: { max: number; start?: number }) {
  const [quantity, setQuantity] = useState(start);
  return <TicketStepper name="Regular" tierId="t-reg" quantity={quantity} max={max} onChange={setQuantity} />;
}

describe('the ticket quantity stepper, held for EVENTS-06', () => {
  it('a user can add and take away tickets, and the count follows', async () => {
    await render(<Held max={5} />);
    expect(screen.getByTestId('tier-t-reg-count').props.children).toBe(1);
    await fireEvent.press(screen.getByLabelText('More Regular tickets'));
    await fireEvent.press(screen.getByLabelText('More Regular tickets'));
    expect(screen.getByTestId('tier-t-reg-count').props.children).toBe(3);
    await fireEvent.press(screen.getByLabelText('Fewer Regular tickets'));
    expect(screen.getByTestId('tier-t-reg-count').props.children).toBe(2);
    expect(screen.getByLabelText('2 Regular tickets')).toBeTruthy();
  });

  it('cannot go above what is left, or below none', async () => {
    await render(<Held max={2} start={1} />);
    await fireEvent.press(screen.getByLabelText('More Regular tickets'));
    expect(screen.getByLabelText('More Regular tickets').props.accessibilityState.disabled).toBe(true);
    await fireEvent.press(screen.getByLabelText('More Regular tickets'));
    expect(screen.getByTestId('tier-t-reg-count').props.children).toBe(2);
    await fireEvent.press(screen.getByLabelText('Fewer Regular tickets'));
    await fireEvent.press(screen.getByLabelText('Fewer Regular tickets'));
    expect(screen.getByLabelText('Fewer Regular tickets').props.accessibilityState.disabled).toBe(true);
    expect(screen.getByTestId('tier-t-reg-count').props.children).toBe(0);
  });

  it('asks the screen for a change and holds no count of its own', async () => {
    const onChange = jest.fn();
    await render(<TicketStepper name="VIP" tierId="t-vip" quantity={1} max={5} onChange={onChange} />);
    await fireEvent.press(screen.getByLabelText('More VIP tickets'));
    expect(onChange).toHaveBeenCalledWith(2);
    expect(screen.getByTestId('tier-t-vip-count').props.children).toBe(1);
  });
});
