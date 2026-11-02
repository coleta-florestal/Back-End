import { BadRequestException, ConflictException } from '@nestjs/common';
import { PlotStatus, SubPlotStatus } from '../../generated/prisma/enums';
import { InventoryStatusService } from './inventory-status.service';

describe('InventoryStatusService', () => {
  const service = new InventoryStatusService();

  describe('changes to plots and parcels', () => {
    it.each([PlotStatus.NOT_STARTED, PlotStatus.IN_PROGRESS])(
      'allows changes to a plot with status %s',
      (status) => {
        expect(() => service.assertPlotCanBeChanged(status)).not.toThrow();
      },
    );

    it('blocks changes to a finished plot', () => {
      expect(() => service.assertPlotCanBeChanged(PlotStatus.FINISHED)).toThrow(ConflictException);
    });

    it.each([SubPlotStatus.NOT_STARTED, SubPlotStatus.IN_PROGRESS])(
      'allows changes to an open parcel with status %s',
      (status) => {
        expect(() =>
          service.assertSubPlotCanBeChanged(PlotStatus.IN_PROGRESS, status),
        ).not.toThrow();
      },
    );

    it('blocks changes to a closed parcel', () => {
      expect(() =>
        service.assertSubPlotCanBeChanged(PlotStatus.IN_PROGRESS, SubPlotStatus.CLOSED),
      ).toThrow(ConflictException);
    });

    it.each(Object.values(SubPlotStatus))('blocks parcel %s in a finished plot', (status) => {
      expect(() => service.assertSubPlotCanBeChanged(PlotStatus.FINISHED, status)).toThrow(
        ConflictException,
      );
    });
  });

  describe('starting collection', () => {
    it('starts the plot and parcel together on the first collection', () => {
      expect(service.startCollection(PlotStatus.NOT_STARTED, SubPlotStatus.NOT_STARTED)).toEqual({
        plotStatus: PlotStatus.IN_PROGRESS,
        subPlotStatus: SubPlotStatus.IN_PROGRESS,
      });
    });

    it('keeps an ongoing collection in progress', () => {
      expect(service.startCollection(PlotStatus.IN_PROGRESS, SubPlotStatus.IN_PROGRESS)).toEqual({
        plotStatus: PlotStatus.IN_PROGRESS,
        subPlotStatus: SubPlotStatus.IN_PROGRESS,
      });
    });

    it('does not reopen a closed parcel when collecting', () => {
      expect(() => service.startCollection(PlotStatus.IN_PROGRESS, SubPlotStatus.CLOSED)).toThrow(
        ConflictException,
      );
    });

    it('does not restart a finished plot', () => {
      expect(() => service.startCollection(PlotStatus.FINISHED, SubPlotStatus.NOT_STARTED)).toThrow(
        ConflictException,
      );
    });
  });

  describe('closing parcels', () => {
    it('closes a parcel with at least one tree', () => {
      expect(service.closeSubPlot(PlotStatus.IN_PROGRESS, SubPlotStatus.IN_PROGRESS, 1)).toBe(
        SubPlotStatus.CLOSED,
      );
    });

    it.each([0, -1, 1.5, NaN, Infinity])('rejects an invalid tree count: %s', (count) => {
      expect(() =>
        service.closeSubPlot(PlotStatus.IN_PROGRESS, SubPlotStatus.IN_PROGRESS, count),
      ).toThrow(BadRequestException);
    });

    it('requires collection to be started', () => {
      expect(() =>
        service.closeSubPlot(PlotStatus.IN_PROGRESS, SubPlotStatus.NOT_STARTED, 1),
      ).toThrow(ConflictException);
    });

    it('rejects a repeated closing', () => {
      expect(() => service.closeSubPlot(PlotStatus.IN_PROGRESS, SubPlotStatus.CLOSED, 1)).toThrow(
        ConflictException,
      );
    });

    it('blocks closing a parcel in a finished plot', () => {
      expect(() => service.closeSubPlot(PlotStatus.FINISHED, SubPlotStatus.IN_PROGRESS, 1)).toThrow(
        ConflictException,
      );
    });
  });

  describe('reopening parcels', () => {
    it('reopens a closed parcel while the plot is in progress', () => {
      expect(service.reopenSubPlot(PlotStatus.IN_PROGRESS, SubPlotStatus.CLOSED)).toBe(
        SubPlotStatus.IN_PROGRESS,
      );
    });

    it.each([PlotStatus.NOT_STARTED, PlotStatus.FINISHED])(
      'blocks reopening when plot status is %s',
      (status) => {
        expect(() => service.reopenSubPlot(status, SubPlotStatus.CLOSED)).toThrow(
          ConflictException,
        );
      },
    );

    it.each([SubPlotStatus.NOT_STARTED, SubPlotStatus.IN_PROGRESS])(
      'rejects reopening a parcel that is %s',
      (status) => {
        expect(() => service.reopenSubPlot(PlotStatus.IN_PROGRESS, status)).toThrow(
          ConflictException,
        );
      },
    );
  });

  describe('finishing plots', () => {
    it('finishes a plot whose parcels are all closed', () => {
      expect(
        service.finishPlot(PlotStatus.IN_PROGRESS, [SubPlotStatus.CLOSED, SubPlotStatus.CLOSED]),
      ).toBe(PlotStatus.FINISHED);
    });

    it('allows a single closed parcel; statistical sample size is a separate rule', () => {
      expect(service.finishPlot(PlotStatus.IN_PROGRESS, [SubPlotStatus.CLOSED])).toBe(
        PlotStatus.FINISHED,
      );
    });

    it('requires at least one parcel', () => {
      expect(() => service.finishPlot(PlotStatus.IN_PROGRESS, [])).toThrow(BadRequestException);
    });

    it.each([SubPlotStatus.NOT_STARTED, SubPlotStatus.IN_PROGRESS])(
      'blocks finishing when a parcel is %s',
      (status) => {
        expect(() =>
          service.finishPlot(PlotStatus.IN_PROGRESS, [SubPlotStatus.CLOSED, status]),
        ).toThrow(ConflictException);
      },
    );

    it('does not finish a plot before collection starts', () => {
      expect(() => service.finishPlot(PlotStatus.NOT_STARTED, [SubPlotStatus.CLOSED])).toThrow(
        ConflictException,
      );
    });

    it('rejects a repeated finalization', () => {
      expect(() => service.finishPlot(PlotStatus.FINISHED, [SubPlotStatus.CLOSED])).toThrow(
        ConflictException,
      );
    });
  });

  it('follows start, close and finish, then blocks new changes', () => {
    const started = service.startCollection(PlotStatus.NOT_STARTED, SubPlotStatus.NOT_STARTED);
    const closed = service.closeSubPlot(started.plotStatus, started.subPlotStatus, 3);
    const finished = service.finishPlot(started.plotStatus, [closed]);

    expect(finished).toBe(PlotStatus.FINISHED);
    expect(() => service.assertSubPlotCanBeChanged(finished, closed)).toThrow(ConflictException);
    expect(() => service.reopenSubPlot(finished, closed)).toThrow(ConflictException);
  });

  it('requires a reopened parcel to be closed again before finishing the plot', () => {
    const reopened = service.reopenSubPlot(PlotStatus.IN_PROGRESS, SubPlotStatus.CLOSED);

    expect(() => service.finishPlot(PlotStatus.IN_PROGRESS, [reopened])).toThrow(ConflictException);

    const closedAgain = service.closeSubPlot(PlotStatus.IN_PROGRESS, reopened, 2);
    expect(service.finishPlot(PlotStatus.IN_PROGRESS, [closedAgain])).toBe(PlotStatus.FINISHED);
  });
});
