'use strict';

APP_LOCAL_ROUTES.dynamics = '/dynamics/:simulationId';

app.config(function($routeProvider, localRoutesProvider) {
    var localRoutes = localRoutesProvider.$get();
    $routeProvider
        .when(localRoutes.source, {
            controller: 'WARPSourceController as source',
            templateUrl: '/static/html/warp-source.html?' + SIREPO_APP_VERSION,
        })
        .when(localRoutes.dynamics, {
            controller: 'WARPDynamicsController as dynamics',
            templateUrl: '/static/html/warp-dynamics.html?' + SIREPO_APP_VERSION,
        });
});

app.controller('WARPDynamicsController', function(activeSection) {
    activeSection.setActiveSection('dynamics');
    var self = this;
});

app.controller('WARPSourceController', function($scope, activeSection, appState) {
    activeSection.setActiveSection('source');
    var self = this;
    $scope.appState = appState;
    var constants = {
        echarge: 1.602176565e-19,
        eps0: 8.85418781762e-12,
        emass: 9.10938291e-31,
        clight: 299792458.0,
        gammafrm: 1.0,
    };
    constants.betafrm = Math.sqrt(1.0 -1.0 / Math.pow(constants.gammafrm, 2));

    function calculateWaistAndLength(newValue, oldValue) {
        if (newValue) {
            var laserPulse = appState.models.laserPulse;
            if (laserPulse.pulseDimensions == 'r') {
                var wplab = Math.sqrt(
                    appState.models.electronPlasma.density
                        * Math.pow(constants.echarge, 2)
                        / (constants.eps0 * constants.emass));
                var kplab = wplab / constants.clight;
                laserPulse.waist = (1e6 * laserPulse.spotSize / kplab).toFixed(12);
                laserPulse.duration = (1e12 * laserPulse.length / kplab / constants.clight).toFixed(12);
            }
        }
    }

    function calculateXZMinMax(newValue, oldValue) {
        if (newValue) {
            var grid = appState.models.simulationGrid;
            if (grid.gridDimensions == 's') {
                var laserPulse = appState.models.laserPulse;
                var totalLength = laserPulse.duration / 1e12 * 4 * constants.clight;
                grid.xMax = (2.5 * totalLength * 1e6).toFixed(12);
                grid.xMin = (-grid.xMax).toFixed(12);
                grid.zMin = (-1.3 * totalLength * 1e6).toFixed(12);
                var lambdaLaser = laserPulse.wavelength / 1e6 * constants.gammafrm * (1.0 + constants.betafrm);
                grid.zMax = (2.0 * lambdaLaser * 1e6).toFixed(12);
                grid.zCount = Math.round((grid.zMax - grid.zMin) / 1e6 * grid.zLambda / lambdaLaser);
            }
        }
    }

    function fieldClass(field) {
        return '.model-' + field.replace('.', '-');
    }

    function setVisibility(fields, isVisible, oldValue) {
        for (var i = 0; i < fields.length; i++) {
            var fc = fieldClass(fields[i]);
            if (isVisible) {
                if (oldValue)
                    $(fc).parent().slideDown()
            }
            else {
                if (oldValue)
                    $(fc).parent().slideUp()
                else
                    $(fc).parent().hide();
            }
        }
    }

    function setReadOnly(fields, isReadOnly) {
        for (var i = 0; i < fields.length; i++) {
            $(fieldClass(fields[i]) + ' input').prop('readonly', isReadOnly);
        }
    }

    function gridDimensionsChanged(newValue, oldValue) {
        if (newValue) {
            var fields = ['simulationGrid.xMin', 'simulationGrid.xMax', 'simulationGrid.zMin', 'simulationGrid.zMax', 'simulationGrid.zCount'];
            if (newValue == 'a') {
                setVisibility(['simulationGrid.zLambda'], false, oldValue);
                setReadOnly(fields, false);
            }
            else {
                setVisibility(['simulationGrid.zLambda'], true, oldValue);
                setReadOnly(fields, true);
                calculateXZMinMax(1);
            }
        }
    }

    function pulseDimensionsChanged(newValue, oldValue) {
        if (newValue) {
            var fields = ['laserPulse.waist', 'laserPulse.duration'];
            if (newValue == 'a') {
                setVisibility(['laserPulse.length', 'laserPulse.spotSize'], false, oldValue);
                setReadOnly(fields, false);
            }
            else {
                setVisibility(['laserPulse.length', 'laserPulse.spotSize'], true, oldValue);
                setReadOnly(fields, true);
                calculateWaistAndLength(1);
            }
        }
    }

    $scope.$watch('appState.models.laserPulse.pulseDimensions', pulseDimensionsChanged);
    $scope.$watch('appState.models.laserPulse.length', calculateWaistAndLength);
    $scope.$watch('appState.models.laserPulse.spotSize', calculateWaistAndLength);
    $scope.$watch('appState.models.electronPlasma.density', calculateWaistAndLength);
    $scope.$watch('appState.models.simulationGrid.gridDimensions', gridDimensionsChanged);
    $scope.$watch('appState.models.simulationGrid.zLambda', calculateXZMinMax);
    $scope.$watch('appState.models.laserPulse.duration', calculateXZMinMax);
    $scope.$watch('appState.models.laserPulse.wavelength', calculateXZMinMax);
});
