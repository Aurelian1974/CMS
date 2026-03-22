import { useRef } from 'react';
import { BryntumDemoHeader, BryntumPanel, BryntumSchedulerPro, BryntumSplitter } from '@bryntum/schedulerpro-react';
import {
    type Checkbox, type SchedulerProListenersTypes, SchedulerResourceModel, type SlideToggleListenersTypes
} from '@bryntum/schedulerpro';
import { usePanelProps, useschedulerProProps } from './AppConfig';
import Appointment from './lib/Appointment';
import './App.scss';

class AppResourceModel extends SchedulerResourceModel {
    declare role : string;
    static override get fields() {
        return [
            'role'
        ];
    }
}

function App() {

    // Helper method used to get available resources
    const getAvailableResources = (eventRecord : Appointment) => {
        const schedulerPro = schedulerProRef.current!.instance;

        return schedulerPro.resourceStore.query((resourceRecord: AppResourceModel) =>
            resourceRecord.role === eventRecord.requiredRole || !eventRecord.requiredRole);
    };

    // Don't allow events that can only be assigned to a specific resource to be dragged to another resource
    const eventDragStart : SchedulerProListenersTypes['eventDragStart'] = ({ eventRecords }) => {
        const
            panel               = panelRef.current!.instance,
            schedulerPro        = schedulerProRef.current!.instance,
            constrainToResource = (panel.widgetMap.constrainToResource as Checkbox).checked,
            availableResources  = getAvailableResources(eventRecords[0] as Appointment);

        schedulerPro.features.eventDrag.constrainDragToResource = constrainToResource || availableResources.length === 1;
    };

    // Selection change event on SchedulerPro
    const selectionChange: SchedulerProListenersTypes['selectionChange']  = () => {
        const
            schedulerPro          = schedulerProRef.current!.instance,
            { selectedRecords }   = schedulerPro,
            { calendarHighlight } = schedulerPro.features;

        if (!calendarHighlight.disabled && selectedRecords.length > 0) {
            calendarHighlight.highlightResourceCalendars(selectedRecords as SchedulerResourceModel[]);
        }
        else {
            calendarHighlight.unhighlightCalendars();
        }
    };

    // Change event on SlideToggle on Panel
    const onSlideToggleChange : SlideToggleListenersTypes['change'] = ({ source }) => {
        const
            schedulerPro = schedulerProRef.current!.instance!,
            { features } = schedulerPro,
            { checked }  = source;

        switch (source.ref) {
            case 'enableDragDrop' :
                features.eventDrag.disabled = !checked;
                break;
            case 'constrainToResource' :
                features.eventDrag.constrainDragToResource = checked;
                break;
            case 'highlight' :
                features.calendarHighlight.disabled = !checked;
                break;
            case 'snap' :
                schedulerPro.snap = checked;
                break;
            default :
                break;
        }
    };

    const
        schedulerProRef    = useRef<BryntumSchedulerPro>(null),
        panelRef           = useRef<BryntumPanel>(null),
        schedulerProProps = useschedulerProProps(eventDragStart, selectionChange, getAvailableResources),
        panelConfig        = usePanelProps(onSlideToggleChange);

    return (
        <>
            <BryntumDemoHeader />
            <div id="content" className="demo-app">
                <BryntumSchedulerPro
                    ref={schedulerProRef}
                    {...schedulerProProps}
                />
                <BryntumSplitter />
                <BryntumPanel
                    ref={panelRef}
                    {...panelConfig}
                />
            </div>
        </>
    );
}

export default App;
