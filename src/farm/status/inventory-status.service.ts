import { BadRequestException, ConflictException, Injectable } from '@nestjs/common';
import { PlotStatus, SubPlotStatus } from '../../generated/prisma/enums';

@Injectable()
export class InventoryStatusService {
  assertPlotCanBeChanged(status: PlotStatus) {
    if (status === PlotStatus.FINISHED) {
      throw new ConflictException('The plot has already been finished');
    }
  }

  assertSubPlotCanBeChanged(plotStatus: PlotStatus, status: SubPlotStatus) {
    this.assertPlotCanBeChanged(plotStatus);

    if (status === SubPlotStatus.CLOSED) {
      throw new ConflictException('The parcel has already been closed');
    }
  }

  startCollection(plotStatus: PlotStatus, status: SubPlotStatus) {
    this.assertSubPlotCanBeChanged(plotStatus, status);

    return { plotStatus: PlotStatus.IN_PROGRESS, subPlotStatus: SubPlotStatus.IN_PROGRESS };
  }

  closeSubPlot(plotStatus: PlotStatus, status: SubPlotStatus, treeCount: number) {
    this.assertSubPlotCanBeChanged(plotStatus, status);

    if (status !== SubPlotStatus.IN_PROGRESS) {
      throw new ConflictException('Collection must be started before closing the parcel');
    }

    if (!Number.isInteger(treeCount) || treeCount < 1) {
      throw new BadRequestException('A parcel must have trees before it can be closed');
    }

    return SubPlotStatus.CLOSED;
  }

  reopenSubPlot(plotStatus: PlotStatus, status: SubPlotStatus) {
    if (plotStatus !== PlotStatus.IN_PROGRESS) {
      throw new ConflictException('A parcel can only be reopened while its plot is in progress');
    }

    if (status !== SubPlotStatus.CLOSED) {
      throw new ConflictException('Only closed parcels can be reopened');
    }

    return SubPlotStatus.IN_PROGRESS;
  }

  finishPlot(status: PlotStatus, parcelStatuses: SubPlotStatus[]) {
    this.assertPlotCanBeChanged(status);

    if (parcelStatuses.length === 0) {
      throw new BadRequestException('A plot must have parcels before it can be finished');
    }

    if (status !== PlotStatus.IN_PROGRESS) {
      throw new ConflictException('Collection must be started before finishing the plot');
    }

    if (parcelStatuses.some((parcelStatus) => parcelStatus !== SubPlotStatus.CLOSED)) {
      throw new ConflictException('All parcels must be closed before finishing the plot');
    }

    return PlotStatus.FINISHED;
  }
}
