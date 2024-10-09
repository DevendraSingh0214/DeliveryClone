sap.ui.define([
    "sap/ui/core/mvc/Controller",
    'sap/ui/core/BusyIndicator',
    "sap/ui/core/UIComponent",
    "sap/ui/model/json/JSONModel",
    "sap/m/MessageBox",
    'sap/ui/model/Filter',
    'sap/m/Token',
    'sap/ui/model/FilterOperator',
    'sap/ui/core/Fragment',
    'sap/m/MessageToast',
    'sap/ui/export/library',
    'sap/ui/export/Spreadsheet',
],
    function (Controller, BusyIndicator, UIComponent, JSONModel, MessageBox, Filter, Token, FilterOperator, Fragment, MessageToast, exportLibrary, Spreadsheet) {
        "use strict";
        var EdmType = exportLibrary.EdmType;
        return Controller.extend("zsddeliverycreation.controller.FirstScreen", {
            onInit: function () {
                this.getView().setModel(new sap.ui.model.json.JSONModel, "oDataModel");
                this.getView().getModel("oDataModel").setProperty("/aTableData", []);
                this.getView().getModel("oDataModel").setProperty("/aSecondTableData", []);
                this.getView().getModel("oDataModel").setProperty("/aAllBackendDataforDelete", []);
                this.getView().getModel("oDataModel").setProperty("/SearchSalesOrderMaterial", []);
                this.getView().setModel(new sap.ui.model.json.JSONModel, "YY1_PACKINGTYPE_CDS");
                this.getView().getModel("YY1_PACKINGTYPE_CDS").setProperty("/YY1_PACKINGTYPE", []);
                const CurrentDate = new Date();
                const CurrentDate1 = `${CurrentDate.getFullYear()}-${CurrentDate.getMonth() + 1 < 10 ? '0' : ''}${CurrentDate.getMonth() + 1}-${CurrentDate.getDate() < 10 ? '0' : ''}${CurrentDate.getDate()}`;

                this.getView().byId("idDocumentDatePicker").setValue(CurrentDate1);
                this.getView().byId("idActualDeliveryDatePicker").setValue(CurrentDate1);
                var fnValidator = function (args) {
                    var text = args.text;
                    return new Token({ key: text, text: text });
                };
                this.getView().byId("idSalesOrderNoInput").addValidator(fnValidator);
                this.getView().byId("idNoofCopyInput").setValue(1);
                var that = this;
                BusyIndicator.show();
                var oModel = new sap.ui.model.odata.v2.ODataModel("/sap/opu/odata/sap/YY1_PACKINGTYPE_CDS");
                oModel.read("/YY1_PACKINGTYPE", {
                    success: function (ores) {
                        that.getView().getModel("YY1_PACKINGTYPE_CDS").setProperty("/YY1_PACKINGTYPE", ores.results);
                        BusyIndicator.hide();
                        that.onSalesOrderNumberValueHelpRequest();
                    },
                    error: () => {
                        BusyIndicator.hide();
                    },
                });
            },
            // by standard sale Order Api
            onGoButtonPress1: function () {
                BusyIndicator.show();
                var that = this;
                var filterValues = this.getView().byId("idSalesOrderNoInput").getTokens().map(function (oToken) {
                    return (oToken.getText()).toString();
                });
                if (filterValues.length != "") {
                    var filterString = filterValues.map(function (value) {
                        return "SalesOrder eq '" + value + "'";
                    }).join(" or ");
                    var oDataUrl = "/sap/opu/odata/sap/API_SALES_ORDER_SRV/A_SalesOrder?$inlinecount=allpages&$top=50000&$expand=to_Item,to_Partner,to_PaymentPlanItemDetails,to_BillingPlan,to_PrecedingProcFlowDoc,to_PricingElement,to_RelatedObject,to_SubsequentProcFlowDoc,to_Text&$filter=" + filterString;
                    var oModel = new sap.ui.model.json.JSONModel();
                    oModel.loadData(oDataUrl, null, true, "GET", null, false);
                    oModel.attachRequestCompleted(async function (oEvent) {
                        var oData = oEvent.getSource().oData.d.results;
                        var aTableData = [];
                        oData.map(function (item) {
                            var toItem = item.to_Item.results;
                            toItem.map(function (items) {
                                var obj = {
                                    "SalesOrderNo": items.SalesOrder,
                                    "SalesOrderItem": items.SalesOrderItem,
                                    "MaterialCode": items.Material,
                                    "MaterialDescription": items.SalesOrderItemText,
                                    "OpenQuantity": "",
                                    "StockQuantity": "",
                                    "DeliveryQuantity": "",
                                    "DeliveryQuantity_valueState": "None",
                                    "TotalDeliveryQuantity": ""
                                }
                                aTableData.push(obj);
                            })
                        })
                        that.getView().getModel("oDataModel").setProperty("/aTableData", aTableData);
                        BusyIndicator.hide();
                    });

                }

            },
            onGoButtonPress: function (oEvent) {
                BusyIndicator.show();
                var that = this;
                var SalesOrderNumber = this.getView().byId("idSalesOrderNoInput").getTokens().map(function (oToken) {
                    return oToken.getText();
                });
                if (SalesOrderNumber.length != "") {
                    var aFilterArr = [];
                    SalesOrderNumber.map(function (item) {
                        aFilterArr.push(new sap.ui.model.Filter("SalesOrder", sap.ui.model.FilterOperator.Contains, item))
                    })
                    var oModel = new sap.ui.model.odata.v2.ODataModel("/sap/opu/odata/sap/ZDELIVERYCREATION_BIN");
                    oModel.read("/Delivery_Creation", {
                        filters: aFilterArr,
                        urlParameters: { "$top": "5000" },
                        success: function (ores) {
                            if (ores.results.length != 0) {
                                BusyIndicator.hide();
                                that.getView().getModel("oDataModel").setProperty("/SearchSalesOrderMaterial", ores.results);
                                that.getView().getModel("oDataModel").setProperty("/SearchSalesOrderMaterial1", ores.results);
                                that.getView().byId("idSalesOrderNoInput").setValueState("None");
                                that.getView().byId("idSalesOrderNoInput").setValueStateText("");
                                // that.getView().byId("idSalesOrderNoInput").setValue(ores.results[0].SalesOrder);
                                that.getView().byId("idPackingTypeComboBox").setValue(ores.results[0].YY1_PackingType_SDH);
                                that.getView().byId("idStorageLocationComboBox").setValue(ores.results[0].YY1_StorageLocati01_SDH);
                                that.getView().byId("idSoldtoPartyCodeInput").setValue(ores.results[0].SOLDTOCODE);
                                that.getView().byId("idShiptoPartyCodeInput").setValue(ores.results[0].SHIPTOCODE);
                                that.getView().byId("idTransporterCodeInput").setValue(ores.results[0].TRANSPORTCODE);
                                that.getView().byId("idBoxVendorCodeInput").setValue(ores.results[0].BOXVENDORCODE);
                                that.getView().byId("idPackerCodeInput").setValue(ores.results[0].PACKERCODE);
                                that.getView().byId("idParcelSticherCodeInput").setValue(ores.results[0].sticherCODE);
                                that.getView().byId("idParcelCarrierCodeInput").setValue(ores.results[0].CarrierCODE);
                                that.getView().byId("idSoldtoPartyNameInput").setValue(ores.results[0].SOLDTONAME);
                                that.getView().byId("idShiptoPartyNameInput").setValue(ores.results[0].SHIPTONAME);
                                that.getView().byId("idTransporterNameInput").setValue(ores.results[0].TRANSPORTNAME);
                                that.getView().byId("idBoxVendorNameInput").setValue(ores.results[0].BOXVENDORNAME);
                                that.getView().byId("idPackerNameInput").setValue(ores.results[0].PACKERNAME);
                                that.getView().byId("idParcelSticherNameInput").setValue(ores.results[0].sticherNAME);
                                that.getView().byId("idParcelCarrierNameInput").setValue(ores.results[0].CarrierNAME);
                                that.getView().byId("idRemark1Input").setValue(ores.results[0].YY1_Remark1_SDH);
                                that.getView().byId("idRemark2Input").setValue(ores.results[0].YY1_Remark2_SDH);
                                that.getView().byId("idRemark3Input").setValue(ores.results[0].YY1_Remark3_SDH);

                                that.getView().byId("idHasteCodeInput").setValue(ores.results[0].hasteCODE);
                                that.getView().byId("idHasteNameInput").setValue(ores.results[0].hasteNAME);

                                that.getView().byId("idBrockerCodeInput").setValue(ores.results[0].BrokerCode);
                                that.getView().byId("idBrockerNameInput").setValue(ores.results[0].BrokerName);
                                const NumberofCopy = that.getView().byId("idNoofCopyInput").getValue();
                                var aTableData = [];
                                ores.results.map(function (item, index) {
                                    var TotalDeliveryQuantity = Number(item.OPENQTY) * Number(NumberofCopy);
                                    var obj = {
                                        "SalesOrderNo": item.SalesOrder,
                                        "SalesOrderItem": item.SalesOrderItem,
                                        "SalesOrderItem1": ((index + 1) * 10).toString(),
                                        "MaterialCode": item.Product,
                                        "MaterialDescription": item.Productdis,
                                        "OpenQuantity": item.OPENQTY,
                                        "StockQuantity": item.STOCKQTY,
                                        "DeliveryQuantity": item.OPENQTY,
                                        "CatalogueNumber": item.catalogcode,
                                        "CatalogueDescription": item.catalogname,
                                        "TotalDeliveryQuantity": (TotalDeliveryQuantity).toString(),
                                        "YY1_PackingType_SDH": item.YY1_PackingType_SDH,
                                        "YY1_StorageLocati01_SDH": item.YY1_StorageLocati01_SDH,
                                        "SalesOrderItemCategory": item.SalesOrderItemCategory,
                                        "RowModes": item.SalesOrderItemCategory == "TAP" ? "Warning" : "Success",
                                        "SOLDTOCODE": item.SOLDTOCODE,
                                        "SHIPTOCODE": item.SHIPTOCODE,
                                        "TRANSPORTCODE": item.TRANSPORTCODE,
                                        "VENDORCODE": item.BOXVENDORCODE,
                                        "PACKERCODE": item.PACKERCODE,
                                        "sticherCODE": item.sticherCODE,
                                        "CarrierCODE": item.CarrierCODE,
                                        "hasteCODE": item.hasteCODE,
                                        "hasteNAME": item.hasteNAME,
                                        "SOLDTONAME": item.SOLDTONAME,
                                        "SHIPTONAME": item.SHIPTONAME,
                                        "TRANSPORTNAME": item.TRANSPORTNAME,
                                        "VENDORNAME": item.BOXVENDORNAME,
                                        "PACKERNAME": item.PACKERNAME,
                                        "BrokerCode": item.BrokerCode,
                                        "BrokerName": item.BrokerName,
                                        "TaxablePrice": item.Taxableprice,
                                        "Discount": item.Discount,
                                        "TaxableAmount": (Number(item.OPENQTY) * Number(item.Taxableprice)).toString(),


                                        "sticherNAME": item.sticherNAME,
                                        "CarrierNAME": item.CarrierNAME,
                                        "YY1_Remark1_SDH": item.YY1_Remark1_SDH,
                                        "YY1_Remark2_SDH": item.YY1_Remark2_SDH,
                                        "YY1_Remark3_SDH": item.YY1_Remark3_SDH,
                                        "UnitOfMeasure_E": item.UnitOfMeasure_E,
                                        "YY1_Withcatalogue_SDH": item.YY1_Withcatalogue_SDH,
                                        "TableDeliveryQuantityFieldEditable": true,
                                    }
                                    if (item.SalesOrderItemCategory != "TAP" && ((TotalDeliveryQuantity > Number(item.OPENQTY)) || (TotalDeliveryQuantity > Number(item.STOCKQTY)))) {
                                        obj["DeliveryQuantity_valueState"] = "Error";
                                    } else {
                                        obj["DeliveryQuantity_valueState"] = "None";
                                    }
                                    aTableData.push(obj);
                                })
                                that.getView().getModel("oDataModel").setProperty("/aTableData", aTableData);
                                var total = aTableData.reduce(function (total, currentValue, ind) {
                                    if (currentValue.SalesOrderItemCategory != "TAP") {
                                        return total + Number(currentValue.DeliveryQuantity);
                                    } else {
                                        return total + 0;
                                    }
                                }, 0);


                                var totalTaxableAmount = aTableData.reduce(function (totalTaxableAmount, a) {
                                    return totalTaxableAmount + Number(a.TaxableAmount);
                                }, 0);
                                that.getView().byId('idTotalDeliveryQuantityInput').setValue(total);
                                that.getView().byId('idTaxableAmountInput').setValue(totalTaxableAmount);
                                that.getView().getModel("oDataModel").setProperty("/aAllBackendData", aTableData);
                                that.getView().getModel("oDataModel").setProperty("/aAllBackendDataforDelete", aTableData);

                                var aCatalogMaterialAvl = false;
                                for (var D = 0; D < aTableData.length; D++) {
                                    if (aTableData[D].YY1_Withcatalogue_SDH == "01" || aTableData[D].YY1_Withcatalogue_SDH == 1 || aTableData[D].YY1_Withcatalogue_SDH == "1") {
                                        aCatalogMaterialAvl = true;
                                        break;
                                    }
                                }
                                if (aCatalogMaterialAvl == true) {
                                    that.getView().byId("idGenerateButton").setVisible(true);
                                    that.getView().byId("idGenerate1Button").setVisible(false);
                                    that.getView().byId("idGeneratePGIButton").setVisible(false);
                                    that.getView().byId("idGenerateBatchSplitButton").setVisible(false);
                                    that.getView().byId("idProgressIndicator").setVisible(false);
                                    that.getView().setModel(new sap.ui.model.json.JSONModel({ "aCatalogMaterialAvl": true, "aPageName": "With Catalog Material", }), "oCatalogMaterialAvlModel");
                                } else if (aCatalogMaterialAvl == false) {
                                    that.getView().byId("idGenerate1Button").setVisible(true);
                                    that.getView().byId("idGenerateButton").setVisible(false);
                                    that.getView().byId("idGeneratePGIButton").setVisible(false);
                                    that.getView().byId("idGenerateBatchSplitButton").setVisible(false);
                                    that.getView().byId("idProgressIndicator").setVisible(false);
                                    that.getView().setModel(new sap.ui.model.json.JSONModel({ "aCatalogMaterialAvl": false, "aPageName": "Without Catalog Material", }), "oCatalogMaterialAvlModel");
                                }



                                that.getView().byId("idSearchSalesOrderMaterialInput").getBinding("suggestionRows").filter(aFilterArr);
                                BusyIndicator.hide();
                            } else {
                                BusyIndicator.hide();
                                that.getView().byId("idSalesOrderNoInput").setValueState("Warning");
                                that.getView().byId("idSalesOrderNoInput").setValueStateText("Pleasee Enter Valid Sales Order!!!");
                            }
                        },
                        error: () => {
                            BusyIndicator.hide();
                            MessageBox.alert("Error");
                        },
                    });
                } else {
                    BusyIndicator.hide();
                    that.getView().byId("idSalesOrderNoInput").setValueState("Error");
                    that.getView().byId("idSalesOrderNoInput").setValueStateText("Pleasee Enter Sales Order!!!");
                }
            },
            onSalesOrderNumberLivechange: function (oEvent) {
                var sValue = oEvent.getParameters().value;
                var that = this;
                if (sValue != "") {
                    that.getView().byId("idSalesOrderNoInput").setValueState("None");
                    that.getView().byId("idSalesOrderNoInput").setValueStateText("");
                } else {
                    that.getView().byId("idSalesOrderNoInput").setValueState("Error");
                    that.getView().byId("idSalesOrderNoInput").setValueStateText("Pleasee Enter Sales Order!!!");
                }
            },


            onRowSelectionChange: function (oEvent) {
                var aSelectedIndices = this.getView().byId("idGenerateDeliveryTable").getSelectedIndices();
                if (aSelectedIndices.length != 0) {
                    this.getView().byId("idDeleteeButton").setVisible(true);
                    this.getView().byId("idDeliveryQuantityInput").setVisible(true);
                    this.getView().byId("idDeliveryQuantityLabel").setVisible(true);
                    this.getView().byId("idDeliveryQuantityInput").setValue();
                } else {
                    this.getView().byId("idDeleteeButton").setVisible(false);
                    this.getView().byId("idDeliveryQuantityInput").setVisible(false);
                    this.getView().byId("idDeliveryQuantityLabel").setVisible(false);
                }
            },
            onDeleteDeliveryPress: function (oEvent) {
                var that = this;
                var aSelectedIndex1 = this.getView().byId("idGenerateDeliveryTable").getSelectedIndices();
                var aSelectedIndex = [];
                for (var i = 0; i < aSelectedIndex1.length; i++) {
                    var id = aSelectedIndex1[i]
                    var path = this.getView().byId("idGenerateDeliveryTable").getContextByIndex(id).sPath;
                    var idx = parseInt(path.substring(path.lastIndexOf('/') + 1))
                    aSelectedIndex.push(idx)
                }
                let newArray = that.getView().getModel("oDataModel").getProperty("/aTableData").filter((element, index) => !aSelectedIndex.includes(index));
                that.getView().getModel("oDataModel").setProperty("/aTableData", newArray)
                var total = newArray.reduce(function (total, currentValue, ind) {
                    if (currentValue.SalesOrderItemCategory != "TAP") {
                        return total + Number(currentValue.DeliveryQuantity);
                    } else {
                        return total + 0;
                    }
                }, 0);
                that.getView().byId('idTotalDeliveryQuantityInput').setValue(total);


                var totalTaxableAmount = newArray.reduce(function (totalTaxableAmount, a, ind) {
                    return totalTaxableAmount + Number(a.TaxableAmount);
                }, 0);
                that.getView().byId('idTaxableAmountInput').setValue(totalTaxableAmount);

            },
            onDeliveryQuantityLiveChange: function (oEvent) {
                var that = this;
                var sValue = oEvent.getParameters().value;
                var aSelectedIndices = this.getView().byId("idGenerateDeliveryTable").getSelectedIndices();
                var aTableData = this.getView().getModel("oDataModel").getProperty("/aTableData");
                var NumberOfCopy = this.getView().byId("idNoofCopyInput").getValue();
                aSelectedIndices.map(function (item) {
                    aTableData[item].DeliveryQuantity = sValue;
                    aTableData[item].TotalDeliveryQuantity = (sValue * Number(NumberOfCopy)).toString();
                    aTableData[item].TaxableAmount = ((sValue * Number(NumberOfCopy)) * Number(aTableData[item].TaxablePrice)).toString();
                    if (aTableData[item].SalesOrderItemCategory != "TAP" && ((sValue * Number(NumberOfCopy)) > Number(aTableData[item].OpenQuantity) || (sValue * Number(NumberOfCopy)) > Number(aTableData[item].StockQuantity))) {
                        aTableData[item].DeliveryQuantity_valueState = "Error";
                    } else {
                        aTableData[item].DeliveryQuantity_valueState = "None";
                    }
                })
                this.getView().getModel("oDataModel").setProperty("/aTableData", aTableData);
                var total = aTableData.reduce(function (total, currentValue, ind) {
                    if (currentValue.SalesOrderItemCategory != "TAP") {
                        return total + Number(currentValue.DeliveryQuantity);
                    } else {
                        return total + 0;
                    }
                }, 0);
                that.getView().byId('idTotalDeliveryQuantityInput').setValue(total);
                var totalTaxableAmount = aTableData.reduce(function (totalTaxableAmount, a, ind) {
                    return totalTaxableAmount + Number(a.TaxableAmount);
                }, 0);
                that.getView().byId('idTaxableAmountInput').setValue(totalTaxableAmount);
            },

            onNumberofDeliveryLiveChange: function (oEvent) {
                var that = this
                var sValue = Number(oEvent.getParameters().value);
                var NumberofDelivery = this.getView().getModel("oCatalogMaterialAvlModel").getProperty("/aCatalogMaterialAvl") == true ? 51 : 101;

                if (sValue < NumberofDelivery) {
                    var aTableData = this.getView().getModel("oDataModel").getProperty("/aTableData");
                    aTableData.map(function (item) {
                        item.TotalDeliveryQuantity = (sValue * item.DeliveryQuantity);
                        if (item.SalesOrderItemCategory != "TAP" && ((((sValue * item.DeliveryQuantity) > item.OpenQuantity) || ((sValue * item.DeliveryQuantity) > item.StockQuantity)))) {
                            item.DeliveryQuantity_valueState = "Error";
                        } else {
                            item.DeliveryQuantity_valueState = "None";
                        }
                    })
                    this.getView().getModel("oDataModel").setProperty("/aTableData", aTableData);
                    var total = aTableData.reduce(function (total, currentValue, ind) {
                        if (currentValue.SalesOrderItemCategory != "TAP") {
                            return total + Number(currentValue.DeliveryQuantity);
                        } else {
                            return total + 0;
                        }
                    }, 0);
                    var totalTaxableAmount = aTableData.reduce(function (totalTaxableAmount, a, ind) {
                        return totalTaxableAmount + Number(a.TaxableAmount);

                    }, 0);
                    that.getView().byId('idTotalDeliveryQuantityInput').setValue(total);
                    that.getView().byId('idTaxableAmountInput').setValue(totalTaxableAmount);
                } else {
                    that.getView().byId("idNoofCopyInput").setValue(NumberofDelivery - 1);
                }
            },

            onDeliveryQuantityTablesLiveChange: function (oEvent) {
                var that = this;
                var sValue = Number(oEvent.getParameters().value);
                var oTableModel = this.getView().getModel('oDataModel');
                var sPath = oEvent.getSource().getBindingContext('oDataModel');
                if (sPath.getObject().SalesOrderItemCategory != "TAP" && (((sValue * Number(this.getView().byId("idNoofCopyInput").getValue())) > Number(sPath.getObject().OpenQuantity)) || ((sValue * Number(this.getView().byId("idNoofCopyInput").getValue())) > Number(sPath.getObject().StockQuantity)))) {
                    oTableModel.getProperty(sPath.getPath()).DeliveryQuantity_valueState = "Error";
                    oTableModel.getProperty(sPath.getPath()).TotalDeliveryQuantity = (sValue * Number(this.getView().byId("idNoofCopyInput").getValue())).toString();
                } else {
                    oTableModel.getProperty(sPath.getPath()).DeliveryQuantity_valueState = "None";
                    oTableModel.getProperty(sPath.getPath()).TotalDeliveryQuantity = (sValue * Number(this.getView().byId("idNoofCopyInput").getValue())).toString();
                }
                oTableModel.getProperty(sPath.getPath()).TaxableAmount = parseFloat(sValue * Number(sPath.getObject().TaxablePrice)).toFixed(2);
                oTableModel.setProperty(sPath.getPath(), oTableModel.getProperty(sPath.getPath()));
                var indArr = [];
                var tabInd = (sPath.getPath()).split("/aTableData/")[1];
                var total = 0;
                var totalTaxableAmount = 0;

                oTableModel.getProperty("/aTableData").map(function (item, ind) {
                    if (item.SalesOrderItemCategory != "TAP") {
                        if (tabInd == ind) {
                            total = total + sValue;
                        } else {
                            total = total + Number(item.DeliveryQuantity);
                        }
                    }
                    if (tabInd == ind) {
                        totalTaxableAmount = totalTaxableAmount + (sValue * Number(item.TaxablePrice));
                    } else {
                        totalTaxableAmount = totalTaxableAmount + Number(item.TaxableAmount);
                    }

                });
                that.getView().byId('idTotalDeliveryQuantityInput').setValue(total);
                that.getView().byId('idTaxableAmountInput').setValue(totalTaxableAmount);
            },


            onSalectionTypeComboBoxChange: function (oEvent) {
                var that = this;
                var sValue = oEvent.getParameters().value;
                if (sValue == "Search by SO Material") {
                    this.getView().getModel("oDataModel").setProperty("/SearchSalesOrderMaterial", this.getView().getModel("oDataModel").getProperty("/SearchSalesOrderMaterial1"));
                    this.getView().getModel("oDataModel").setProperty("/aTableData", []);
                    this.getView().byId("idSearchSalesOrderMaterialInput").setValueState("None");
                    this.getView().byId("idSearchSalesOrderMaterialInput").setVisible(true);
                    this.getView().byId("idSearchSOMaterialLabel").setVisible(true);
                    var total = that.getView().getModel("oDataModel").getProperty("/aTableData").reduce(function (total, currentValue, ind) {
                        if (currentValue.SalesOrderItemCategory != "TAP") {
                            return total + Number(currentValue.DeliveryQuantity);
                        } else {
                            return total + 0;
                        }
                    }, 0);
                    that.getView().byId('idTotalDeliveryQuantityInput').setValue(total);
                } else if (sValue == "Select All") {
                    this.getView().getModel("oDataModel").setProperty("/aTableData", this.getView().getModel("oDataModel").getProperty("/aAllBackendData"));
                    this.getView().byId("idSearchSalesOrderMaterialInput").setValueState("None");
                    this.getView().byId("idSearchSalesOrderMaterialInput").setVisible(false);
                    this.getView().byId("idSearchSOMaterialLabel").setVisible(false);
                    var total = that.getView().getModel("oDataModel").getProperty("/aAllBackendData").reduce(function (total, currentValue, ind) {
                        if (currentValue.SalesOrderItemCategory != "TAP") {
                            return total + Number(currentValue.DeliveryQuantity);
                        } else {
                            return total + 0;
                        }
                    }, 0);
                    that.getView().byId('idTotalDeliveryQuantityInput').setValue(total);
                } else { this.getView().byId("idSearchSalesOrderMaterialInput").setValueState("Error"); }
            },

            onInputSuggestionItemSelected: function (oEvent) {
                var MaterialCode = oEvent.getParameters().selectedRow.getCells()[0].mProperties.text;
                var SalesOrderNo = oEvent.getParameters().selectedRow.getCells()[3].mProperties.text;
                var SalesOrderItem = oEvent.getParameters().selectedRow.getCells()[4].mProperties.text;
                var that = this;
                const aFilteredArr1 = that.getView().getModel("oDataModel").getProperty("/aAllBackendData").filter(JSR => (JSR.MaterialCode == MaterialCode) && (JSR.SalesOrderItem == SalesOrderItem) && (JSR.SalesOrderNo == SalesOrderNo));
                const aFilteredArr3 = that.getView().getModel("oDataModel").getProperty("/SearchSalesOrderMaterial").filter(JSR => (JSR.Product == MaterialCode) && (JSR.SalesOrderItem == SalesOrderItem) && (JSR.SalesOrder == SalesOrderNo));
                const uniqueNewArr = that.getView().getModel("oDataModel").getProperty("/SearchSalesOrderMaterial").filter(abc =>
                    !aFilteredArr3.some(def =>
                        def.Product === abc.Product &&
                        def.SalesOrder === abc.SalesOrder &&
                        def.SalesOrderItem === abc.SalesOrderItem &&
                        def.Productdis === abc.Productdis
                    )
                );
                that.getView().getModel("oDataModel").setProperty("/SearchSalesOrderMaterial", uniqueNewArr);
                var aTableData = that.getView().getModel("oDataModel").getProperty("/aTableData");
                that.getView().getModel("oDataModel").setProperty("/aTableData", that.getView().getModel("oDataModel").getProperty("/aTableData").concat(aFilteredArr1));
                var aNewArr = aTableData.concat(aFilteredArr1);
                var total = 0;
                aNewArr.map(function (currentValue, ind) {
                    if (currentValue.SalesOrderItemCategory != "TAP") {
                        total = total + Number(currentValue.DeliveryQuantity);
                    } else {
                        total = total + 0;
                    }
                });
                that.getView().byId('idTotalDeliveryQuantityInput').setValue(total);
                that.getView().byId('idSearchSalesOrderMaterialInput').setValue();
            },














            onInputValueHelpRequest: function (oEvent) {
                this.sKey = oEvent.getSource().getCustomData()[0].getKey();
                var oView = this.getView();
                if (!this.aSupplierValueHelp) {
                    this.aSupplierValueHelp = Fragment.load({
                        id: oView.getId(),
                        name: "zsddeliverycreation.view.fragments.ValueHelpDialog",
                        controller: this
                    }).then(function (oSupplierValueHelpDialog) {
                        oView.addDependent(oSupplierValueHelpDialog);
                        return oSupplierValueHelpDialog;
                    });
                }
                this.aSupplierValueHelp.then(function (oSupplierValueHelpDialog) {
                    var oTemplate = new sap.m.StandardListItem({
                        title: "{Supplier}",
                        info: "{SupplierFullName}",
                        type: "Active"
                    });
                    oSupplierValueHelpDialog.bindAggregation("items", {
                        path: '/Supplierdata',
                        template: oTemplate
                    });
                    oSupplierValueHelpDialog.setTitle("Select Supplier Code");
                    oSupplierValueHelpDialog.open();
                }.bind(this));
            },
            onSelectDialogConfirm: function (oEvent) {
                var that = this;
                var oObject = oEvent.getParameter("selectedContexts")[0].getObject();
                that.getView().byId("id" + that.sKey + "CodeInput").setValue(oObject.Supplier);
                that.getView().byId("id" + that.sKey + "NameInput").setValue(oObject.SupplierFullName);
            },
            onSelectDialogSearch: function (oEvent) {
                var oFilter = new Filter([
                    new Filter("Supplier", FilterOperator.Contains, oEvent.getParameter("value")),
                    new Filter("SupplierFullName", FilterOperator.Contains, oEvent.getParameter("value")),
                ])
                oEvent.getParameter("itemsBinding").filter([oFilter]);
            },

            onSalesOrderNumberValueHelpRequest: function (oEvent) {
                var oView = this.getView();
                if (!this.aValueHelp) {
                    this.aValueHelp = Fragment.load({
                        id: oView.getId(),
                        name: "zsddeliverycreation.view.fragments.SalesOrderValueHelpDialog",
                        controller: this
                    }).then(function (oValueHelpDialog) {
                        oView.addDependent(oValueHelpDialog);
                        return oValueHelpDialog;
                    });
                }
                this.aValueHelp.then(function (oValueHelpDialog) {
                    var oTemplate = new sap.m.StandardListItem({
                        title: "{SalesOrder}",
                        info: "{SOLDTONAME}",
                        description: "{YY1_Withcatalogue_SDH}",
                        type: "Active"
                    });
                    oValueHelpDialog.bindAggregation("items", {
                        path: '/ZSO_F4',
                        template: oTemplate
                    });
                    oValueHelpDialog.setTitle("Select Sales Order Code");
                    oValueHelpDialog.open();
                }.bind(this));
            },

            onSelectSalesOrderValueHelpDialogConfirm11: function (oEvent) {
                var aSelectedItems = oEvent.getParameter("selectedItems"),
                    oMultiInput = this.getView().byId("idSalesOrderNoInput");
                if (aSelectedItems && aSelectedItems.length > 0) {
                    aSelectedItems.forEach(function (oItem) {
                        oMultiInput.addToken(new Token({
                            text: oItem.getTitle()
                        }));
                    });
                }
            },

            onSelectSalesOrderValueHelpDialogConfirm: function (oEvent) {
                var oBusy = new sap.m.BusyDialog({
                    text: "Selecting..."
                });
                oBusy.open();
                var oBinding = oEvent.getSource().getBinding("items"),
                    oMultiInput = this.getView().byId("idSalesOrderNoInput");

                oBinding.filter([]);
                var aContexts = oEvent.getParameter("selectedContexts");
                aContexts.map(function (item) {
                    oMultiInput.addToken(new Token({
                        text: item.getObject().SalesOrder
                    }));
                })
                oBusy.close();
                this.onGoButtonPress();
            },
            onSelecSalesOrderValueHelpSalesOrderValueHelpDialogSearch: function (oEvent) {

                const substring = oEvent.getParameter("value");
                const filterString = `substringof('${substring}', SalesOrder)`;

                var oFilter = new Filter([
                    new Filter("SalesOrder", FilterOperator.Contains, oEvent.getParameter("value")),
                    // new Filter({path: "SalesOrder",operator: sap.ui.model.FilterOperator.Contains,value1: substring}),
                    new Filter("SOLDTONAME", FilterOperator.Contains, oEvent.getParameter("value")),
                ])
                oEvent.getParameter("itemsBinding").filter([oFilter]);
            },


            onGenerateDeliveryPress: function () {
                if (this.getView().getModel("oCatalogMaterialAvlModel").getProperty("/aCatalogMaterialAvl") == true) {
                    this.onGenerateDeliveryPress_WithCatalogMaterial();
                } else {
                    this.onGenerateDeliveryPress_WithoutCatalogMaterial();
                }
            },


            //Without Adding Delivery Items Delete API
            onGenerateDeliveryPress_WithoutCatalogMaterial: function (oEvent) {
                var that = this;
                var aLineItemData = that.getView().getModel("oDataModel").getProperty("/aTableData");
                // BusyIndicator.show();
                const aError = [];
                const aSOLDTOCODEError = [];
                const aSHIPTOCODEError = [];
                // const aTRANSPORTCODEError = [];
                const aVENDORCODEError = [];
                const aPACKERCODEError = [];
                const asticherCODEError = [];
                const aCarrierCODEError = [];
                const aSOLDTOCODEError1 = [];
                const aSHIPTOCODEError1 = [];
                // const aTRANSPORTCODEError1 = [];
                const aVENDORCODEError1 = [];
                const aPACKERCODEError1 = [];
                const asticherCODEError1 = [];
                const aCarrierCODEError1 = [];
                const ahasteCODEError = [];
                const ahasteCODEError1 = [];
                const aBrokerCodeError = [];
                const aBrokerCodeError1 = [];
                if (aLineItemData.length != 0) {
                    aLineItemData.map(function (item, ind) {
                        if (item.SalesOrderItemCategory != "TAP" && ((Number(item.TotalDeliveryQuantity) > Number(item.OpenQuantity)) || (Number(item.TotalDeliveryQuantity) > Number(item.StockQuantity)))) {
                            aError.push("Error");
                            item.DeliveryQuantity_valueState = "Error";
                        } else {
                            item.DeliveryQuantity_valueState = "None";
                        }
                        if (ind == 0) {
                            aSOLDTOCODEError.push(item.SOLDTOCODE);
                            aSHIPTOCODEError.push(item.SHIPTOCODE);
                            // aTRANSPORTCODEError.push(item.TRANSPORTCODE);
                            aVENDORCODEError.push(item.VENDORCODE);
                            aPACKERCODEError.push(item.PACKERCODE);
                            asticherCODEError.push(item.sticherCODE);
                            aCarrierCODEError.push(item.CarrierCODE);
                            ahasteCODEError.push(item.hasteCODE);
                            aBrokerCodeError.push(item.BrokerCode);
                        } else {
                            if (aSOLDTOCODEError.includes(item.SOLDTOCODE) == false) { aSOLDTOCODEError1.push("Error") }
                            if (aSHIPTOCODEError.includes(item.SHIPTOCODE) == false) { aSHIPTOCODEError1.push("Error") }
                            // if (aTRANSPORTCODEError.includes(item.TRANSPORTCODE) == false) { aTRANSPORTCODEError1.push("Error") }
                            if (aVENDORCODEError.includes(item.VENDORCODE) == false) { aVENDORCODEError1.push("Error") }
                            if (aPACKERCODEError.includes(item.PACKERCODE) == false) { aPACKERCODEError1.push("Error") }
                            if (asticherCODEError.includes(item.sticherCODE) == false) { asticherCODEError1.push("Error") }
                            if (aCarrierCODEError.includes(item.CarrierCODE) == false) { aCarrierCODEError1.push("Error") }
                            if (ahasteCODEError.includes(item.hasteCODE) == false) { ahasteCODEError1.push("Error") }
                            if (aBrokerCodeError.includes(item.BrokerCode) == false) { aBrokerCodeError1.push("Error") }
                        }
                    })
                    if (aError.length != 0) {
                        BusyIndicator.hide();
                        that.getView().getModel("oDataModel").setProperty("/aTableData", aLineItemData)
                        var synth3 = window.speechSynthesis;
                        var utterThis3 = new SpeechSynthesisUtterance("Please  Check Delivery Quantity First");
                        synth3.speak(utterThis3);
                        MessageBox.error("Please  Check Delivery Quantity First");
                    }
                    else if (
                        aSOLDTOCODEError1.length != 0 ||
                        aSHIPTOCODEError1.length != 0 ||
                        // aTRANSPORTCODEError1.length != 0 ||
                        aVENDORCODEError1.length != 0 ||
                        aPACKERCODEError1.length != 0 ||
                        asticherCODEError1.length != 0 ||
                        ahasteCODEError1.length != 0 ||
                        aCarrierCODEError1.length != 0) {
                        var aErrorText = "";
                        var aErrorText1 = "Please Select Unique";
                        if (aSOLDTOCODEError1.length != 0) {
                            aErrorText = aErrorText + "Please Select Unique Sold to Party Codes Sales Order\n"
                            aErrorText1 = aErrorText1 + "Sold to Party Code";
                        }
                        if (aSHIPTOCODEError1.length != 0) {
                            aErrorText = aErrorText + "Please Select Unique Ship to Party Codes Sales Order\n"
                            aErrorText1 = aErrorText1 + "Ship to Party Code";
                        }
                        if (ahasteCODEError1.length != 0) {
                            aErrorText = aErrorText + "Please Select Unique Haste Codes Sales Order\n"
                            aErrorText1 = aErrorText1 + "Ship to Party Code";
                        }
                        // if (aTRANSPORTCODEError1.length != 0) {
                        //     aErrorText = aErrorText + "Please Select Unique Transporter Codes Sales Order\n"
                        //     aErrorText1 = aErrorText1 + "Transporter Code";
                        // }
                        if (aVENDORCODEError1.length != 0) {
                            aErrorText = aErrorText + "Please Select Unique Vendor Codes Sales Order\n"
                            aErrorText1 = aErrorText1 + "Vendor Code";
                        }
                        if (aPACKERCODEError1.length != 0) {
                            aErrorText = aErrorText + "Please Select Unique Parker Codes Sales Order\n"
                            aErrorText1 = aErrorText1 + "Parker Code";
                        }
                        if (asticherCODEError1.length != 0) {
                            aErrorText = aErrorText + "Please Select Unique Sticher Codes Sales Order\n"
                            aErrorText1 = aErrorText1 + "Sticher Code";
                        }
                        if (aCarrierCODEError1.length != 0) {
                            aErrorText = aErrorText + "Please Select Unique Carrier Codes Sales Order\n"
                            aErrorText1 = aErrorText1 + "Carrier Code";
                        }
                        if (aBrokerCodeError1.length != 0) {
                            aErrorText = aErrorText + "Please Select Unique Broker Codes Sales Order\n"
                            aErrorText1 = aErrorText1 + "Broker Code";
                        }
                        MessageBox.error(aErrorText);
                        var synth3 = window.speechSynthesis;
                        var utterThis3 = new SpeechSynthesisUtterance(aErrorText1 + " for Sales Order");
                        synth3.speak(utterThis3);
                    }
                    else {
                        var that = this;
                        var aLineItemData = that.getView().getModel("oDataModel").getProperty("/aTableData");
                        aLineItemData.map(function (items) {
                            items.TableDeliveryQuantityFieldEditable = false;
                        })
                        that.getView().getModel("oDataModel").setProperty("/aTableData", aLineItemData)
                        var NumberOfCopy = Number(this.getView().byId("idNoofCopyInput").getValue());
                        var oBusy = new sap.m.BusyDialog({
                            text: "Scheduling..."
                        });
                        oBusy.open();
                        var Scheduling1 = window.speechSynthesis;
                        var Scheduling2 = new SpeechSynthesisUtterance("Scheduling");
                        Scheduling1.speak(Scheduling2);
                        // that.getView().byId("")
                        const aRespoArr = [];
                        for (var D = 1; D <= NumberOfCopy; D++) {
                            aRespoArr.push({
                                "SerialNumber": (D * 10).toString(),
                                "DeliveryNumber": "",
                                "DeliveryNumberActive": false,
                                "Error": "",
                                "PGIStatus": "",
                                "BatchStatus": "",
                                "DeliveryItemData": [],
                            })
                        }
                        var aProgress = this.getView().byId("idProgressIndicator");
                        aProgress.setPercentValue('0%');
                        aProgress.setDisplayValue('0%');

                        var aProgrssIndicatorPercentage = 100 / NumberOfCopy;
                        that.getView().byId("idGenerateDeliveryIconTabFilter").setEnabled(false)
                        that.getView().getModel("oDataModel").setProperty("/aSecondTableData", aRespoArr);
                        var url = "/sap/opu/odata/sap/API_OUTBOUND_DELIVERY_SRV;v=0002/A_OutbDeliveryHeader";
                        that.getView().byId("idGenerateDeliveryIconTabFilter").setEnabled(false);
                        $.ajax({
                            type: "GET",
                            url: url,
                            async: true,
                            contentType: "application/json",
                            dataType: 'json',
                            beforeSend: function (xhr) {
                                xhr.setRequestHeader('X-CSRF-Token', 'fetch');
                            },
                            complete: function (response) {
                                const token = response.getResponseHeader('X-CSRF-Token');
                                function convertActualGoodsMovementDateToSAPDate(dateString) {
                                    const date = new Date(dateString);
                                    const timestamp = date.getTime();
                                    return `/Date(${timestamp})/`;
                                }
                                const CurrentDate = new Date();
                                const CurrentDate1 = `${CurrentDate.getFullYear()}-${CurrentDate.getMonth() + 1 < 10 ? '0' : ''}${CurrentDate.getMonth() + 1}-${CurrentDate.getDate() < 10 ? '0' : ''}${CurrentDate.getDate()}`;

                                const ActualGoodsMovementDate = convertActualGoodsMovementDateToSAPDate(that.getView().byId("idActualDeliveryDatePicker").getValue());

                                function convertDocumentDateToSAPDate(dateString) {
                                    const date = new Date(dateString);
                                    const timestamp = date.getTime();
                                    return `/Date(${timestamp})/`;
                                }
                                const DocumentDate = convertDocumentDateToSAPDate(that.getView().byId("idDocumentDatePicker").getValue());

                                async function processDeliveryData(aRespoArr, url, that) {
                                    const promises = [];
                                    for (let index = 0; index < aRespoArr.length; index++) {
                                        const newObj = {
                                            // "ActualGoodsMovementDate": that.getView().byId("idActualDeliveryDatePicker").getValue(),
                                            // "DeliveryDate": that.getView().byId("idDocumentDatePicker").getValue(),
                                            // "ActualGoodsMovementDate": that.getView().byId("idActualDeliveryDatePicker").getValue()+ "T00:00:00",
                                            // "DeliveryDate": that.getView().byId("idDocumentDatePicker").getValue()+ "T00:00:00",
                                            // "ActualGoodsMovementDate": ActualGoodsMovementDate,
                                            // "DeliveryDate": DocumentDate,
                                            "YY1_Remark1_DLH": that.getView().byId("idRemark1Input").getValue(),
                                            "YY1_Remark2_DLH": that.getView().byId("idRemark2Input").getValue(),
                                            "YY1_Remark3_DLH": that.getView().byId("idRemark3Input").getValue(),
                                            "YY1_PackingType_DLH": that.getView().byId("idPackingTypeComboBox").getValue(),
                                            "YY1_SalesTransporter_DLH": that.getView().byId("idTransporterCodeInput").getValue(),
                                            "YY1_ParcelCarrier_DLH": that.getView().byId("idParcelCarrierCodeInput").getValue(),
                                            "YY1_StorageLocati01_DLH": that.getView().byId("idStorageLocationComboBox").getValue(),
                                            "to_DeliveryDocumentItem": {
                                                "results": []
                                            }
                                        };
                                        aLineItemData.map(function (item) {
                                            newObj.to_DeliveryDocumentItem.results.push(
                                                {
                                                    "ReferenceSDDocument": item.SalesOrderNo,
                                                    "ReferenceSDDocumentItem": item.SalesOrderItem,
                                                    "ActualDeliveryQuantity": item.DeliveryQuantity,
                                                    "DeliveryQuantityUnit": item.UnitOfMeasure_E,
                                                    // "StorageLocation": that.getView().byId("idStorageLocationComboBox").getValue(),
                                                }
                                            )
                                        })
                                        const promise = new Promise((resolve, reject) => {
                                            $.ajax({
                                                type: "POST",
                                                url: url,
                                                async: true,
                                                headers: {
                                                    "X-CSRF-TOKEN": token,
                                                    "Accept": "application/json",
                                                    "Content-Type": "application/json",
                                                    "Authorization": "Basic UFBfU01QTDAxOnFrSEZWSlplZHhQRERvfmlBdVhDVGhVTjRycFZGUkdKUFNXZWt6cGo="
                                                },
                                                data: JSON.stringify(newObj),
                                                success: function (data) {
                                                    const SalesOrderArr = that.getView().getModel("oDataModel").getProperty("/aSecondTableData");
                                                    SalesOrderArr[index].DeliveryNumber = data.d.DeliveryDocument;
                                                    SalesOrderArr[index].Error = "";
                                                    oBusy.close();
                                                    that.getView().getModel("oDataModel").setProperty("/aSecondTableData", SalesOrderArr);
                                                    var abc = aProgress.getPercentValue();
                                                    aProgress.setPercentValue(((Number(abc)) + aProgrssIndicatorPercentage) + '%');
                                                    aProgress.setDisplayValue(((Number(abc)) + aProgrssIndicatorPercentage) + '%');
                                                    oBusy.close();
                                                    // resolve("Success");
                                                    // resolve("Error");

                                                    $.ajax({
                                                        type: "POST",
                                                        url: "/sap/opu/odata/sap/API_OUTBOUND_DELIVERY_SRV;v=0002/PostGoodsIssue?DeliveryDocument=" + "'" + data.d.DeliveryDocument + "'",
                                                        async: true,
                                                        headers: {
                                                            "X-CSRF-TOKEN": token,
                                                            "Accept": "application/json",
                                                            "etag": "*",
                                                            "If-Match": '*',
                                                            "DataServiceVersion": "2.0",
                                                            "Content-Type": "application/json",
                                                            "Authorization": "Basic UFBfU01QTDAxOnFrSEZWSlplZHhQRERvfmlBdVhDVGhVTjRycFZGUkdKUFNXZWt6cGo=",
                                                        },
                                                        success: function (data) {
                                                            SalesOrderArr[index].PGIStatus = "Success";
                                                            that.getView().getModel("oDataModel").setProperty("/aSecondTableData", SalesOrderArr);
                                                            var abc = aProgress.getPercentValue();
                                                            aProgress.setPercentValue(((Number(abc)) + aProgrssIndicatorPercentage) + '%');
                                                            aProgress.setDisplayValue(((Number(abc)) + aProgrssIndicatorPercentage) + '%');
                                                            oBusy.close();
                                                            resolve("Success");
                                                        },
                                                        error: function (error) {
                                                            oBusy.close();
                                                            const message1 = (error.responseJSON.error.innererror.errordetails.length !== 0)
                                                                ? error.responseJSON.error.innererror.errordetails[0].message
                                                                : error.responseJSON.error.message.value;

                                                            SalesOrderArr[index].Error = message1;
                                                            SalesOrderArr[index].PGIStatus = "Error";
                                                            that.getView().getModel("oDataModel").setProperty("/aSecondTableData", SalesOrderArr);
                                                            var abc = aProgress.getPercentValue();
                                                            aProgress.setPercentValue(((Number(abc)) + aProgrssIndicatorPercentage) + '%');
                                                            aProgress.setDisplayValue(((Number(abc)) + aProgrssIndicatorPercentage) + '%');
                                                            resolve("Error");
                                                        }
                                                    });
                                                    // that.getView().getModel("oDataModel").setProperty("/aSecondTableData", SalesOrderArr);
                                                    // resolve("Success");

                                                },
                                                error: function (error) {
                                                    const message1 = (error.responseJSON.error.innererror.errordetails.length !== 0)
                                                        ? error.responseJSON.error.innererror.errordetails[0].message
                                                        : error.responseJSON.error.message.value;
                                                    var SalesOrderArr = that.getView().getModel("oDataModel").getProperty("/aSecondTableData")
                                                    SalesOrderArr[index].Error = message1;
                                                    that.getView().getModel("oDataModel").setProperty("/aSecondTableData", SalesOrderArr);
                                                    oBusy.close();
                                                    var abc = aProgress.getPercentValue();
                                                    aProgress.setPercentValue(((Number(abc)) + aProgrssIndicatorPercentage) + '%');
                                                    aProgress.setDisplayValue(((Number(abc)) + aProgrssIndicatorPercentage) + '%');
                                                    resolve("Error");
                                                }
                                            });
                                        });
                                        promises.push(promise);
                                        await promise; // Wait for the current promise to resolve before proceeding to the next one
                                    }
                                    const results = await Promise.all(promises);
                                    const aTextArr = [];
                                    aTextArr.push(...results);
                                    var count = aTextArr.reduce(function (accumulator, currentValue) {
                                        return currentValue === "Error" ? accumulator + 1 : accumulator;
                                    }, 0);
                                    var count1 = aTextArr.reduce(function (accumulator, currentValue) {
                                        return currentValue === "Success" ? accumulator + 1 : accumulator;
                                    }, 0);

                                    that.getView().byId("idGenerateDeliveryIconTabFilter").setEnabled(true);
                                    if (count1 != 0) {
                                        var aMessage = count1 + " Deliveries Are Created With PGI";
                                        var Scheduling3 = window.speechSynthesis;
                                        var Scheduling4 = new SpeechSynthesisUtterance(aMessage);
                                        Scheduling3.speak(Scheduling4);
                                        MessageBox.success(aMessage, {
                                            actions: ["Download", sap.m.MessageBox.Action.NO],
                                            emphasizedAction: "Download",
                                            onClose: function (sAction) {
                                                if (sAction === "Download") {
                                                    that.onExport();
                                                    that.oCallDeliveryDocumentItemPress();
                                                } else {
                                                    that.oCallDeliveryDocumentItemPress();
                                                }
                                            }
                                        });
                                    } else {
                                        // var Scheduling3 = window.speechSynthesis;
                                        // var Scheduling4 = new SpeechSynthesisUtterance("Deliveries Are Created With PGI");
                                        // Scheduling3.speak(Scheduling4);
                                        // MessageBox.success("Deliveries Are Created With PGI", {
                                        //     actions: ["Download", sap.m.MessageBox.Action.NO],
                                        //     emphasizedAction: "Download",
                                        //     onClose: function (sAction) {
                                        //         if (sAction === "Download") {
                                        //             that.onExport();
                                        //         }
                                        //     }
                                        // });
                                    }
                                }
                                processDeliveryData(aRespoArr, url, that).catch((error) => {
                                    console.error(error);
                                });
                            }
                        });
                    }
                }
            },

            //without Pgi Working Code
            onGenerateDeliveryPress_WithCatalogMaterial: function (oEvent) {
                var that = this;
                var aLineItemData = that.getView().getModel("oDataModel").getProperty("/aTableData");
                // BusyIndicator.show();
                const aError = [];
                const aSOLDTOCODEError = [];
                const aSHIPTOCODEError = [];
                // const aTRANSPORTCODEError = [];
                const aVENDORCODEError = [];
                const aPACKERCODEError = [];
                const asticherCODEError = [];
                const aCarrierCODEError = [];
                const aSOLDTOCODEError1 = [];
                const aSHIPTOCODEError1 = [];
                // const aTRANSPORTCODEError1 = [];
                const aVENDORCODEError1 = [];
                const aPACKERCODEError1 = [];
                const asticherCODEError1 = [];
                const ahasteCODEError = [];
                const ahasteCODEError1 = [];
                const aCarrierCODEError1 = [];
                const aBrokerCodeError1 = [];
                const aBrokerCodeError = [];
                if (aLineItemData.length != 0 && Number(that.getView().byId("idNoofCopyInput").getValue()) < 51) {
                    aLineItemData.map(function (item, ind) {
                        if (item.SalesOrderItemCategory != "TAP" && ((Number(item.TotalDeliveryQuantity) > Number(item.OpenQuantity)) || (Number(item.TotalDeliveryQuantity) > Number(item.StockQuantity)))) {
                            aError.push("Error");
                            item.DeliveryQuantity_valueState = "Error";
                        } else {
                            item.DeliveryQuantity_valueState = "None";
                        }
                        if (ind == 0) {
                            aSOLDTOCODEError.push(item.SOLDTOCODE);
                            aSHIPTOCODEError.push(item.SHIPTOCODE);
                            // aTRANSPORTCODEError.push(item.TRANSPORTCODE);
                            aVENDORCODEError.push(item.VENDORCODE);
                            aPACKERCODEError.push(item.PACKERCODE);
                            asticherCODEError.push(item.sticherCODE);
                            aCarrierCODEError.push(item.CarrierCODE);
                            ahasteCODEError.push(item.hasteCODE);
                            aBrokerCodeError.push(item.BrokerCode);
                        } else {
                            if (aBrokerCodeError.includes(item.BrokerCode) == false) { aBrokerCodeError1.push("Error") }
                            if (aSOLDTOCODEError.includes(item.SOLDTOCODE) == false) { aSOLDTOCODEError1.push("Error") }
                            if (aSHIPTOCODEError.includes(item.SHIPTOCODE) == false) { aSHIPTOCODEError1.push("Error") }
                            // if (aTRANSPORTCODEError.includes(item.TRANSPORTCODE) == false) { aTRANSPORTCODEError1.push("Error") }
                            if (ahasteCODEError.includes(item.hasteCODE) == false) { ahasteCODEError1.push("Error") }
                            if (aVENDORCODEError.includes(item.VENDORCODE) == false) { aVENDORCODEError1.push("Error") }
                            if (aPACKERCODEError.includes(item.PACKERCODE) == false) { aPACKERCODEError1.push("Error") }
                            if (asticherCODEError.includes(item.sticherCODE) == false) { asticherCODEError1.push("Error") }
                            if (aCarrierCODEError.includes(item.CarrierCODE) == false) { aCarrierCODEError1.push("Error") }
                        }
                    })
                    if (aError.length != 0) {
                        BusyIndicator.hide();
                        that.getView().getModel("oDataModel").setProperty("/aTableData", aLineItemData)
                        var synth3 = window.speechSynthesis;
                        var utterThis3 = new SpeechSynthesisUtterance("Please  Check Delivery Quantity First");
                        synth3.speak(utterThis3);
                        MessageBox.error("Please  Check Delivery Quantity First");
                    }
                    else if (
                        aSOLDTOCODEError1.length != 0 ||
                        aSHIPTOCODEError1.length != 0 ||
                        // aTRANSPORTCODEError1.length != 0 ||
                        aVENDORCODEError1.length != 0 ||
                        aPACKERCODEError1.length != 0 ||
                        asticherCODEError1.length != 0 ||
                        aBrokerCodeError1.length != 0 ||
                        ahasteCODEError1.length != 0 ||
                        aCarrierCODEError1.length != 0) {
                        var aErrorText = "";
                        var aErrorText1 = "Please Select Unique";
                        if (aSOLDTOCODEError1.length != 0) {
                            aErrorText = aErrorText + "Please Select Unique Sold to Party Codes Sales Order\n"
                            aErrorText1 = aErrorText1 + "Sold to Party Code";
                        }
                        if (aBrokerCodeError1.length != 0) {
                            aErrorText = aErrorText + "Please Select Unique Broker Codes Sales Order\n"
                            aErrorText1 = aErrorText1 + "Broker Code";
                        }
                        if (ahasteCODEError1.length != 0) {
                            aErrorText = aErrorText + "Please Select Unique Haste Codes Sales Order\n"
                            aErrorText1 = aErrorText1 + "Ship to Party Code";
                        }
                        if (aSHIPTOCODEError1.length != 0) {
                            aErrorText = aErrorText + "Please Select Unique Ship to Party Codes Sales Order\n"
                            aErrorText1 = aErrorText1 + "Ship to Party Code";
                        }
                        // if (aTRANSPORTCODEError1.length != 0) {
                        //     aErrorText = aErrorText + "Please Select Unique Transporter Codes Sales Order\n"
                        //     aErrorText1 = aErrorText1 + "Transporter Code";
                        // }
                        if (aVENDORCODEError1.length != 0) {
                            aErrorText = aErrorText + "Please Select Unique Vendor Codes Sales Order\n"
                            aErrorText1 = aErrorText1 + "Vendor Code";
                        }
                        if (aPACKERCODEError1.length != 0) {
                            aErrorText = aErrorText + "Please Select Unique Parker Codes Sales Order\n"
                            aErrorText1 = aErrorText1 + "Parker Code";
                        }
                        if (asticherCODEError1.length != 0) {
                            aErrorText = aErrorText + "Please Select Unique Sticher Codes Sales Order\n"
                            aErrorText1 = aErrorText1 + "Sticher Code";
                        }
                        if (aCarrierCODEError1.length != 0) {
                            aErrorText = aErrorText + "Please Select Unique Carrier Codes Sales Order\n"
                            aErrorText1 = aErrorText1 + "Carrier Code";
                        }
                        MessageBox.error(aErrorText);
                        var synth3 = window.speechSynthesis;
                        var utterThis3 = new SpeechSynthesisUtterance(aErrorText1 + " for Sales Order");
                        synth3.speak(utterThis3);
                    }
                    else {
                        var that = this;
                        var aLineItemData = that.getView().getModel("oDataModel").getProperty("/aTableData");
                        aLineItemData.map(function (items) {
                            items.TableDeliveryQuantityFieldEditable = false;
                        })

                        that.getView().byId("idPackingTypeComboBox").setEditable(false);
                        that.getView().byId("idSalectionTypeComboBox").setEditable(true);
                        that.getView().byId("idRemark1Input").setEditable(false);
                        that.getView().byId("idRemark2Input").setEditable(false);
                        that.getView().byId("idRemark3Input").setEditable(false);
                        that.getView().byId("idTransporterCodeInput").setEditable(false);
                        that.getView().byId("idParcelCarrierCodeInput").setEditable(false);

                        that.getView().getModel("oDataModel").setProperty("/aTableData", aLineItemData);
                        var aLineItemData = that.getView().getModel("oDataModel").getProperty("/aTableData");
                        var aAllBackendDataforDelete = that.getView().getModel("oDataModel").getProperty("/aAllBackendDataforDelete");
                        const uniqueNewArr = aAllBackendDataforDelete.filter(abc =>
                            !aLineItemData.some(def =>
                                def.SalesOrder === abc.SalesOrder &&
                                def.SalesOrderItem === abc.SalesOrderItem
                            )
                        );
                        var aPayloadArr = [];
                        aAllBackendDataforDelete.map(function (abc) {
                            const abcd = aLineItemData.filter(def => def.SalesOrder == abc.SalesOrde && def.SalesOrderItem == abc.SalesOrderItem);
                            var ghi = abc;
                            if (abcd.length != 0) {
                                ghi.DeliveryQuantity == abcd[0].DeliveryQuantity;
                            } else {
                                ghi.DeliveryQuantity == "";
                            }
                            aPayloadArr.push(ghi);
                        })
                        var NumberOfCopy = Number(this.getView().byId("idNoofCopyInput").getValue());
                        var oBusy = new sap.m.BusyDialog({
                            text: "Scheduling..."
                        });
                        oBusy.open();
                        // that.getView().byId("")
                        const aRespoArr = [];
                        for (var D = 1; D <= NumberOfCopy; D++) {
                            aRespoArr.push({
                                "SerialNumber": (D * 10).toString(),
                                "DeliveryNumber": "",
                                "Error": "",
                                "DeliveryNumberActive": false,
                                "PGIStatus": "",
                                "BatchStatus": "",
                                "DeliveryItemData": [],
                            })
                        }
                        that.getView().byId("idGenerateDeliveryIconTabFilter").setEnabled(false)
                        that.getView().getModel("oDataModel").setProperty("/aSecondTableData", aRespoArr);
                        var url = "/sap/opu/odata/sap/API_OUTBOUND_DELIVERY_SRV;v=0002/A_OutbDeliveryHeader";
                        $.ajax({
                            type: "GET",
                            url: url,
                            async: true,
                            contentType: "application/json",
                            dataType: 'json',
                            beforeSend: function (xhr) {
                                xhr.setRequestHeader('X-CSRF-Token', 'fetch');
                            },
                            complete: function (response) {
                                const token = response.getResponseHeader('X-CSRF-Token');
                                async function processDeliveryData(aRespoArr, url, that) {
                                    const aDeliveryDeletionArr = [];
                                    var aCreatedDeliveryArr = that.getView().getModel("oDataModel").getProperty("/aSecondTableData");
                                    aCreatedDeliveryArr.map(function (item) {
                                        aLineItemData.map(function (items) {
                                            const newObj = { ...items };
                                            newObj["CreatedDeliveryNumber"] = item.DeliveryNumber;
                                            aDeliveryDeletionArr.push(newObj)
                                        })
                                    })
                                    const promises = [];
                                    for (let index = 0; index < aRespoArr.length; index++) {
                                        const newObj = {
                                            "YY1_Remark1_DLH": that.getView().byId("idRemark1Input").getValue(),
                                            "YY1_Remark2_DLH": that.getView().byId("idRemark2Input").getValue(),
                                            "YY1_Remark3_DLH": that.getView().byId("idRemark3Input").getValue(),
                                            // "ActualGoodsMovementDate": that.getView().byId("idActualDeliveryDatePicker").getValue(),
                                            // "ActualGoodsMovementDate": that.getView().byId("idActualDeliveryDatePicker").getValue()+ "T00:00:00",
                                            // "DeliveryDate": that.getView().byId("idDocumentDatePicker").getValue(),
                                            // "DeliveryDate": that.getView().byId("idDocumentDatePicker").getValue()+ "T00:00:00",

                                            "YY1_PackingType_DLH": that.getView().byId("idPackingTypeComboBox").getValue(),
                                            "YY1_SalesTransporter_DLH": that.getView().byId("idTransporterCodeInput").getValue(),
                                            "YY1_ParcelCarrier_DLH": that.getView().byId("idParcelCarrierCodeInput").getValue(),
                                            "to_DeliveryDocumentItem": {
                                                "results": []
                                            }
                                        };
                                        aPayloadArr.map(function (item) {
                                            newObj.to_DeliveryDocumentItem.results.push(
                                                {
                                                    "ReferenceSDDocument": item.SalesOrderNo,
                                                    "ReferenceSDDocumentItem": item.SalesOrderItem,
                                                    "ActualDeliveryQuantity": item.DeliveryQuantity,
                                                    "DeliveryQuantityUnit": item.UnitOfMeasure_E,
                                                }
                                            )
                                        })
                                        const promise = new Promise((resolve, reject) => {
                                            $.ajax({
                                                type: "POST",
                                                url: url,
                                                async: true,
                                                headers: {
                                                    "X-CSRF-TOKEN": token,
                                                    "Accept": "application/json",
                                                    "Content-Type": "application/json",
                                                    "Authorization": "Basic UFBfU01QTDAxOnFrSEZWSlplZHhQRERvfmlBdVhDVGhVTjRycFZGUkdKUFNXZWt6cGo="
                                                },
                                                data: JSON.stringify(newObj),
                                                success: function (data) {
                                                    oBusy.close();
                                                    const SalesOrderArr = that.getView().getModel("oDataModel").getProperty("/aSecondTableData");
                                                    SalesOrderArr[index].DeliveryNumber = data.d.DeliveryDocument;
                                                    SalesOrderArr[index].Error = "";
                                                    that.getView().getModel("oDataModel").setProperty("/aSecondTableData", SalesOrderArr);
                                                    resolve("Success");
                                                },
                                                error: function (error) {
                                                    const message1 = (error.responseJSON.error.innererror.errordetails.length !== 0)
                                                        ? error.responseJSON.error.innererror.errordetails[0].message
                                                        : error.responseJSON.error.message.value;
                                                    var SalesOrderArr = that.getView().getModel("oDataModel").getProperty("/aSecondTableData");
                                                    SalesOrderArr[index].Error = message1;
                                                    that.getView().getModel("oDataModel").setProperty("/aSecondTableData", SalesOrderArr);
                                                    oBusy.close();
                                                    resolve("Error");
                                                }
                                            });
                                        });
                                        promises.push(promise);
                                        await promise;
                                    }
                                    const results = await Promise.all(promises);
                                    const aTextArr = [];
                                    aTextArr.push(...results);
                                    var oBusy2 = new sap.m.BusyDialog({
                                        text: "Deleting Items..."
                                    });
                                    oBusy2.open();
                                    // https://my410957.s4hana.cloud.sap:443/sap/bc/http/sap/ZDELIVERY_CREATION_HTTP?sap-client=080
                                    $.ajax({
                                        type: "POST",
                                        url: "/sap/bc/http/sap/ZDELIVERY_CREATION_HTTP?sap-client=080",
                                        data: JSON.stringify({
                                            aLineItem: that.getView().getModel("oDataModel").getProperty("/aSecondTableData"),
                                            aLineItemData: that.getView().getModel("oDataModel").getProperty("/aTableData"),
                                            aAllBackendDataforDelete: that.getView().getModel("oDataModel").getProperty("/aAllBackendDataforDelete"),
                                            aDeliveryDeletionArr: aDeliveryDeletionArr,
                                        }),
                                        contentType: "application/json; charset=utf-8",
                                        traditional: true,
                                        success: function (oresponse) {
                                            oBusy2.close();
                                            // MessageBox.alert(oresponse);
                                            that.getView().byId("idGenerateDeliveryIconTabFilter").setEnabled(true);
                                            // MessageBox.success(that.getView().byId("idNoofCopyInput").getValue() + " Delivery Are Created With PGI", {
                                            MessageBox.alert(" Deliveries Are Created....", {
                                                actions: ["Download", sap.m.MessageBox.Action.NO],
                                                emphasizedAction: "Download",
                                                onClose: function (sAction) {
                                                    if (sAction === "Download") {
                                                        that.onExport();
                                                    } else {
                                                        that.oCallDeliveryDocumentItemPress();
                                                    }
                                                }
                                            });
                                        },
                                        error: function (error) {
                                            oBusy2.close();
                                            that.getView().byId("idGenerateDeliveryIconTabFilter").setEnabled(true);
                                            MessageBox.error(error, {});
                                        }
                                    });

                                }
                                processDeliveryData(aRespoArr, url, that).catch((error) => {
                                    console.error(error);
                                });
                            }
                        });
                    }
                }
            },

            onGenerateBatchSplitWithPGIPress: function () {
                if (this.getView().getModel("oCatalogMaterialAvlModel").getProperty("/aCatalogMaterialAvl") == true) {
                    this.onGenerateBatchSplitWithPGIPress_WithCatalogMaterial();
                } else {
                    this.onGenerateBatchSplitWithPGIPress_WithoutCatalogMaterial();
                }
            },

            onGenerateBatchSplitWithPGIPress_WithCatalogMaterial: function (oEvent) {
                var oBusy = new sap.m.BusyDialog({
                    text: "Batch Splitting...."
                });
                oBusy.open();
                var that = this;
                const aCreatedDelieryData = that.getView().getModel("oDataModel").getProperty("/aSecondTableData");
                var oDataModel = new sap.ui.model.odata.v2.ODataModel("/sap/opu/odata/sap/ZDELIVERYCREATION_BIN");
                var that = this;
                var StorageLocation = that.getView().byId("idStorageLocationComboBox").getValue();
                var fetchedData = [];
                var oModel = new sap.ui.model.odata.v2.ODataModel("/sap/opu/odata/sap/ZDELIVERYCREATION_BIN", {
                    useBatch: true
                });
                var aAllData1 = [];
                var aAllData2 = [];
                var iBatchSize = 5000;
                function getAllData(iSkip) {
                    return new Promise(function (resolve, reject) {
                        oModel.read("/Batch_Determin", {
                            urlParameters: {
                                "$top": iBatchSize,
                                "$skip": iSkip
                            },
                            filters: [new sap.ui.model.Filter("StorageLocation", "EQ", StorageLocation)],
                            success: function (oData) {
                                aAllData1 = aAllData1.concat(oData.results);
                                aAllData2 = aAllData2.concat(oData.results);
                                if (oData.results.length < iBatchSize) {
                                    resolve(aAllData1);
                                } else {
                                    resolve(getAllData(iSkip + iBatchSize));
                                }
                            },
                            error: function (oError) {
                                reject(oError);
                            }
                        });
                    });
                }
                getAllData(0).then(function (aAllData1) {
                    var aAllData3 = aAllData1;
                    aAllData3.sort(function (a, b) {
                        return b.Quantity - a.Quantity || a.Product - b.Product;
                    });
                    var aAllData4 = aAllData2;
                    var aNewDeliveryWithMaterialArr = [];
                    aCreatedDelieryData.map(function (item1, ind1, arr1) {
                        var aLineItemData = item1.DeliveryItemData;
                        aLineItemData.map(function (item2, ind2, arr2) {
                            if (item2.SalesOrderItemCategory != "TAP") {
                                var obj = {
                                    "DeliveryDocument": item2.DeliveryDocument,
                                    "DeliveryDocumentItem": item2.DeliveryDocumentItem,
                                    "Material": item2.Material,
                                    "DeliveryQuantity": item2.DeliveryDocumentQuantity,
                                }
                                aNewDeliveryWithMaterialArr.push(obj);
                            }
                        })
                    })
                    var aNEwArr = [];
                    var resultArray = [];
                    aNewDeliveryWithMaterialArr.map(function (item1, ind1, arr1) {
                        var RequiredQuantity = parseFloat(item1.DeliveryQuantity);
                        var accumulatedQuantity = 0;
                        aAllData3.map(function (item2, ind2, arr2) {
                            if (item2.Product == item1.Material && (item2.Quantity != "" && item2.Quantity != "0" && item2.Quantity != "0.00") && accumulatedQuantity < RequiredQuantity) {
                                var currentQuantity = parseFloat(item2.Quantity);
                                var neededQuantity = RequiredQuantity - accumulatedQuantity;
                                if (currentQuantity >= neededQuantity) {
                                    var partialItem = {
                                        "DeliveryDocument": item1.DeliveryDocument,
                                        "DeliveryDocumentItem": item1.DeliveryDocumentItem,
                                        "Batch": item2.Batch,
                                        "Product": item2.Product,
                                        "Plant": item2.Plant,
                                        "MaterialBaseUnit": item2.MaterialBaseUnit,
                                        "Quantity": neededQuantity.toString(),
                                    };
                                    if (neededQuantity > 0) {
                                        resultArray.push(partialItem);
                                    }
                                    accumulatedQuantity += neededQuantity;
                                    item2.Quantity = currentQuantity - neededQuantity;
                                } else {
                                    var partialItem1 = {
                                        "DeliveryDocument": item1.DeliveryDocument,
                                        "DeliveryDocumentItem": item1.DeliveryDocumentItem,
                                        "Batch": item2.Batch,
                                        "Product": item2.Product,
                                        "Plant": item2.Plant,
                                        "MaterialBaseUnit": item2.MaterialBaseUnit,
                                        "Quantity": item2.Quantity,
                                    };
                                    resultArray.push(partialItem1);
                                    item2.Quantity = "0";
                                    accumulatedQuantity += currentQuantity;
                                }
                            }
                        })
                    })
                    $.ajax({
                        type: "GET",
                        url: "/sap/opu/odata/sap/API_OUTBOUND_DELIVERY_SRV;v=0002/A_OutbDeliveryItem",
                        async: false,
                        contentType: "application/json",
                        dataType: 'json',
                        beforeSend: function (xhr) {
                            xhr.setRequestHeader('X-CSRF-Token', 'fetch');
                        },
                        complete: function (response) {
                            const token = response.getResponseHeader('X-CSRF-Token');
                            async function processUniqueSOData(resultArray, that) {
                                const promises = [];
                                for (let index = 0; index < resultArray.length; index++) {
                                    const item = resultArray[index];
                                    const Batch = item.Batch;
                                    const Delivery = item.DeliveryDocument;
                                    const DeliveryDocumentItem = item.DeliveryDocumentItem;
                                    const ActualDeliveryQuantity = item.Quantity;
                                    const promise = new Promise((resolve, reject) => {
                                        $.ajax({
                                            type: "POST",
                                            url: "/sap/opu/odata/sap/API_OUTBOUND_DELIVERY_SRV;v=0002/CreateBatchSplitItem?PickQuantityInSalesUOM=0M&Batch='" + Batch + "'&DeliveryDocument='" + Delivery + "'&DeliveryDocumentItem='" + DeliveryDocumentItem + "'&ActualDeliveryQuantity=" + ActualDeliveryQuantity + "M&DeliveryQuantityUnit='PC'",
                                            async: false,
                                            headers: {
                                                "X-CSRF-TOKEN": token,
                                                "Accept": "application/json",
                                                "etag": "*",
                                                "If-Match": '*',
                                                "DataServiceVersion": "2.0",
                                                "Content-Type": "application/json",
                                                "Authorization": "Basic UFBfU01QTDAxOnFrSEZWSlplZHhQRERvfmlBdVhDVGhVTjRycFZGUkdKUFNXZWt6cGo=",
                                            },
                                            success: function (data) {
                                                resolve("Success");
                                            },
                                            error: function (error) {
                                                const message1 = (error.responseJSON.error.innererror.errordetails.length !== 0)
                                                    ? error.responseJSON.error.innererror.errordetails[0].message
                                                    : error.responseJSON.error.message.value;
                                                resolve("Error");
                                            }
                                        });
                                    });
                                    promises.push(promise);
                                    await promise; // Wait for the current promise to resolve before proceeding to the next one
                                }
                                const results = await Promise.all(promises);
                                const aTextArr = [];
                                aTextArr.push(...results);
                                oBusy.close();
                                that.onGeneratePGIPress();

                            }

                            // Usage
                            processUniqueSOData(resultArray, that).catch((error) => {
                                console.error(error);
                            });
                        }
                    });
                    // oBusy.close();
                }).catch(function (oError) {
                    console.error("Failed to retrieve data:", oError);
                    oBusy.close();
                });

            },

            onGenerateBatchSplitWithPGIPress_WithoutCatalogMaterial: function (oEvent) {
                var oBusy = new sap.m.BusyDialog({
                    text: "Batch Splitting...."
                });
                oBusy.open();
                var that = this;
                const aCreatedDelieryData = that.getView().getModel("oDataModel").getProperty("/aSecondTableData");
                var oDataModel = new sap.ui.model.odata.v2.ODataModel("/sap/opu/odata/sap/ZDELIVERYCREATION_BIN");
                var that = this;
                var StorageLocation = that.getView().byId("idStorageLocationComboBox").getValue();
                var fetchedData = [];
                var oModel = new sap.ui.model.odata.v2.ODataModel("/sap/opu/odata/sap/ZDELIVERYCREATION_BIN", {
                    useBatch: true
                });
                var aAllData1 = [];
                var aAllData2 = [];
                var iBatchSize = 5000;
                function getAllData(iSkip) {
                    return new Promise(function (resolve, reject) {
                        oModel.read("/Batch_Determin", {
                            urlParameters: {
                                "$top": iBatchSize,
                                "$skip": iSkip
                            },
                            filters: [new sap.ui.model.Filter("StorageLocation", "EQ", StorageLocation)],
                            success: function (oData) {
                                aAllData1 = aAllData1.concat(oData.results);
                                aAllData2 = aAllData2.concat(oData.results);
                                if (oData.results.length < iBatchSize) {
                                    resolve(aAllData1);
                                } else {
                                    resolve(getAllData(iSkip + iBatchSize));
                                }
                            },
                            error: function (oError) {
                                reject(oError);
                            }
                        });
                    });
                }
                getAllData(0).then(function (aAllData1) {
                    var aAllData3 = aAllData1;
                    aAllData3.sort(function (a, b) {
                        return b.Quantity - a.Quantity || a.Product - b.Product;
                    });
                    var aAllData4 = aAllData2;
                    var aNewDeliveryWithMaterialArr = [];
                    aCreatedDelieryData.map(function (item1, ind1, arr1) {
                        var aLineItemData = item1.DeliveryItemData;
                        aLineItemData.map(function (item2, ind2, arr2) {
                            if (item2.SalesOrderItemCategory != "TAP") {
                                var obj = {
                                    "DeliveryDocument": item2.DeliveryDocument,
                                    "DeliveryDocumentItem": item2.DeliveryDocumentItem,
                                    "Material": item2.Material,
                                    "DeliveryQuantity": item2.DeliveryDocumentQuantity,
                                }
                                aNewDeliveryWithMaterialArr.push(obj);
                            }
                        })
                    })
                    var aNEwArr = [];
                    var resultArray = [];
                    aNewDeliveryWithMaterialArr.map(function (item1, ind1, arr1) {
                        var RequiredQuantity = parseFloat(item1.DeliveryQuantity);
                        var accumulatedQuantity = 0;
                        aAllData3.map(function (item2, ind2, arr2) {
                            if (item2.Product == item1.Material && (item2.Quantity != "" && item2.Quantity != "0" && item2.Quantity != "0.00") && accumulatedQuantity < RequiredQuantity) {
                                var currentQuantity = parseFloat(item2.Quantity);
                                var neededQuantity = RequiredQuantity - accumulatedQuantity;
                                if (currentQuantity >= neededQuantity) {
                                    var partialItem = {
                                        "DeliveryDocument": item1.DeliveryDocument,
                                        "DeliveryDocumentItem": item1.DeliveryDocumentItem,
                                        "Batch": item2.Batch,
                                        "Product": item2.Product,
                                        "Plant": item2.Plant,
                                        "MaterialBaseUnit": item2.MaterialBaseUnit,
                                        "Quantity": neededQuantity.toString(),
                                    };
                                    if (neededQuantity > 0) {
                                        resultArray.push(partialItem);
                                    }
                                    accumulatedQuantity += neededQuantity;
                                    item2.Quantity = currentQuantity - neededQuantity;
                                } else {
                                    var partialItem1 = {
                                        "DeliveryDocument": item1.DeliveryDocument,
                                        "DeliveryDocumentItem": item1.DeliveryDocumentItem,
                                        "Batch": item2.Batch,
                                        "Product": item2.Product,
                                        "Plant": item2.Plant,
                                        "MaterialBaseUnit": item2.MaterialBaseUnit,
                                        "Quantity": item2.Quantity,
                                    };
                                    resultArray.push(partialItem1);
                                    item2.Quantity = "0";
                                    accumulatedQuantity += currentQuantity;
                                }
                            }
                        })
                    })
                    $.ajax({
                        type: "GET",
                        url: "/sap/opu/odata/sap/API_OUTBOUND_DELIVERY_SRV;v=0002/A_OutbDeliveryItem",
                        async: false,
                        contentType: "application/json",
                        dataType: 'json',
                        beforeSend: function (xhr) {
                            xhr.setRequestHeader('X-CSRF-Token', 'fetch');
                        },
                        complete: function (response) {
                            const token = response.getResponseHeader('X-CSRF-Token');
                            async function processUniqueBatchSplitData(resultArray, that) {
                                const promises = [];
                                for (let index = 0; index < resultArray.length; index++) {
                                    const item = resultArray[index];
                                    const Batch = item.Batch;
                                    const Delivery = item.DeliveryDocument;
                                    const DeliveryDocumentItem = item.DeliveryDocumentItem;
                                    const ActualDeliveryQuantity = item.Quantity;
                                    const promise = new Promise((resolve, reject) => {
                                        $.ajax({
                                            type: "POST",
                                            url: "/sap/opu/odata/sap/API_OUTBOUND_DELIVERY_SRV;v=0002/CreateBatchSplitItem?PickQuantityInSalesUOM=0M&Batch='" + Batch + "'&DeliveryDocument='" + Delivery + "'&DeliveryDocumentItem='" + DeliveryDocumentItem + "'&ActualDeliveryQuantity=" + ActualDeliveryQuantity + "M&DeliveryQuantityUnit='PC'",
                                            async: false,
                                            headers: {
                                                "X-CSRF-TOKEN": token,
                                                "Accept": "application/json",
                                                "etag": "*",
                                                "If-Match": '*',
                                                "DataServiceVersion": "2.0",
                                                "Content-Type": "application/json",
                                                "Authorization": "Basic UFBfU01QTDAxOnFrSEZWSlplZHhQRERvfmlBdVhDVGhVTjRycFZGUkdKUFNXZWt6cGo=",
                                            },
                                            success: function (data) {
                                                resolve("Success");
                                            },
                                            error: function (error) {
                                                const message1 = (error.responseJSON.error.innererror.errordetails.length !== 0)
                                                    ? error.responseJSON.error.innererror.errordetails[0].message
                                                    : error.responseJSON.error.message.value;
                                                resolve("Error");
                                            }
                                        });
                                    });
                                    promises.push(promise);
                                    await promise; // Wait for the current promise to resolve before proceeding to the next one
                                }
                                const results = await Promise.all(promises);
                                const aTextArr = [];
                                aTextArr.push(...results);
                                oBusy.close();
                                // that.onGeneratePGIPress();

                            }

                            // Usage
                            processUniqueBatchSplitData(resultArray, that).catch((error) => {
                                console.error(error);
                            });
                        }
                    });
                    // oBusy.close();
                }).catch(function (oError) {
                    console.error("Failed to retrieve data:", oError);
                    oBusy.close();
                });

            },

            onGeneratePGIPress: function (oEvent) {
                var that = this;
                var aRespoArr = [];
                this.getView().byId("idGeneratePGIButton").setEnabled(false);
                aRespoArr = that.getView().getModel("oDataModel").getProperty("/aSecondTableData");
                $.ajax({
                    type: "GET",
                    url: "/sap/opu/odata/sap/API_OUTBOUND_DELIVERY_SRV;v=0002/A_OutbDeliveryItem",
                    async: true,
                    contentType: "application/json",
                    dataType: 'json',
                    beforeSend: function (xhr) {
                        xhr.setRequestHeader('X-CSRF-Token', 'fetch');
                    },
                    complete: function (response) {
                        const token = response.getResponseHeader('X-CSRF-Token');
                        async function processUniqueSOData(aRespoArr, that) {
                            const promises = [];
                            for (let index = 0; index < aRespoArr.length; index++) {
                                const item = aRespoArr[index];
                                const promise = new Promise((resolve, reject) => {

                                    $.ajax({
                                        type: "POST",
                                        url: "/sap/opu/odata/sap/API_OUTBOUND_DELIVERY_SRV;v=0002/PostGoodsIssue?DeliveryDocument=" + "'" + item.DeliveryNumber + "'",
                                        async: false,
                                        headers: {
                                            "X-CSRF-TOKEN": token,
                                            "Accept": "application/json",
                                            "etag": "*",
                                            "If-Match": '*',
                                            "DataServiceVersion": "2.0",
                                            "Content-Type": "application/json",
                                            "Authorization": "Basic UFBfU01QTDAxOnFrSEZWSlplZHhQRERvfmlBdVhDVGhVTjRycFZGUkdKUFNXZWt6cGo=",
                                        },
                                        success: function (data) {
                                            var SalesOrderArr = that.getView().getModel("oDataModel").getProperty("/aSecondTableData")
                                            SalesOrderArr[index].PGIStatus = "Success";
                                            SalesOrderArr[index].Error = "";
                                            that.getView().getModel("oDataModel").setProperty("/aSecondTableData", SalesOrderArr);
                                            resolve("Success");
                                        },
                                        error: function (error) {
                                            const message1 = (error.responseJSON.error.innererror.errordetails.length !== 0)
                                                ? error.responseJSON.error.innererror.errordetails[0].message
                                                : error.responseJSON.error.message.value;
                                            var SalesOrderArr = that.getView().getModel("oDataModel").getProperty("/aSecondTableData")
                                            SalesOrderArr[index].PGIStatus = "Error";
                                            SalesOrderArr[index].Error = message1;
                                            that.getView().getModel("oDataModel").setProperty("/aSecondTableData", SalesOrderArr);
                                            resolve("Error");
                                        }
                                    });

                                });

                                promises.push(promise);
                                await promise; // Wait for the current promise to resolve before proceeding to the next one
                            }
                            const results = await Promise.all(promises);
                            const aTextArr = [];
                            aTextArr.push(...results);
                            that.getView().byId("idGeneratePGIButton").setEnabled(true);
                            MessageToast.show("All PGI are Generated!!!!")

                        }
                        processUniqueSOData(aRespoArr, that).catch((error) => {
                            console.error(error);
                        });
                    }
                });
            },


            createColumnConfig: function () {
                var aCols = [];
                aCols.push({
                    property: 'SerialNumber',
                    type: EdmType.String
                });
                aCols.push({
                    property: 'DeliveryNumber',
                    type: EdmType.String
                });
                aCols.push({
                    property: 'PGIStatus',
                    type: EdmType.String
                });
                aCols.push({
                    property: 'BatchStatus',
                    type: EdmType.String
                });
                aCols.push({
                    property: 'Error',
                    type: EdmType.String
                });
                return aCols;
            },
            onExport: function () {
                var aCols, oRowBinding, oSettings, oSheet, oTable;
                var that = this;
                if (!this._oTable) {
                    this._oTable = this.byId('idResponseMessageTable');
                }

                oTable = this._oTable;
                oRowBinding = oTable.getBinding('items');
                aCols = this.createColumnConfig();

                oSettings = {
                    workbook: {
                        columns: aCols,
                        hierarchyLevel: 'Level'
                    },
                    dataSource: oRowBinding,
                    fileName: 'Created Deleveries.xlsx',
                    worker: false
                };

                oSheet = new Spreadsheet(oSettings);
                oSheet.build().finally(function () {
                    oSheet.destroy();
                });
                that.oCallDeliveryDocumentItemPress();
            },




















            oCallDeliveryDocumentItemPress: function (oEvent) {
                var oBusy = new sap.m.BusyDialog({
                    text: "Call Delivery Items...."
                });
                oBusy.open();
                oBusy.open();
                var that = this;
                const aCreatedDelieryData = that.getView().getModel("oDataModel").getProperty("/aSecondTableData");
                var oDataModel = new sap.ui.model.odata.v2.ODataModel("/sap/opu/odata/sap/ZDELIVERYCREATION_BIN");
                function fetchItem(item3) {
                    return new Promise((resolve, reject) => {
                        oDataModel.read("/Delivery_Item_With_Material", {
                            filters: [
                                new sap.ui.model.Filter("DeliveryDocument", "EQ", item3.DeliveryNumber),
                            ],
                            success: oResponse => {
                                if (oResponse.results.length) {
                                    item3.DeliveryNumberActive = true;
                                    oResponse.results.map(function (item5) {
                                        item3.DeliveryItemData.push({
                                            "DeliveryDocument": item5.DeliveryDocument,
                                            "DeliveryDocumentItem": item5.DeliveryDocumentItem,
                                            "DeliveryDocumentQuantity": item5.ActualDeliveryQuantity,
                                            "Material": item5.Material,
                                        })
                                    })
                                }
                                resolve();
                            },
                            error: () => reject("Fetch failed")
                        });
                    });
                }
                Promise.all(aCreatedDelieryData.map(fetchItem))
                    .then(function () {
                        console.log("All requests completed successfully");
                        that.getView().getModel("oDataModel").setProperty("/aSecondTableData", aCreatedDelieryData);
                        oBusy.close();
                    })
                    .catch(function () {
                        console.log("Error Occur When Calling Data");
                    })
            },

            oCallDeliveryDocumentItemPressOther1234: function (oEvent) {
                var oBusy = new sap.m.BusyDialog({
                    text: "Call Delivery Items...."
                });
                oBusy.open();
                oBusy.open();
                var that = this;
                const aCreatedDelieryData = that.getView().getModel("oDataModel").getProperty("/aSecondTableData");
                var oDataModel = new sap.ui.model.odata.v2.ODataModel("/sap/opu/odata/sap/ZDELIVERYCREATION_BIN");
                var that = this;
                var fetchedData = [];
                var oModel = new sap.ui.model.odata.v2.ODataModel("/sap/opu/odata/sap/ZDELIVERYCREATION_BIN", {
                    useBatch: true
                });
                var aAllData1 = [];
                var aAllData2 = [];
                var iBatchSize = 5000;
                function getAllData(iSkip) {
                    return new Promise(function (resolve, reject) {
                        oModel.read("/Batch_Determin", {
                            urlParameters: {
                                "$top": iBatchSize,
                                "$skip": iSkip
                            },
                            success: function (oData) {
                                aAllData1 = aAllData1.concat(oData.results);
                                aAllData2 = aAllData2.concat(oData.results);
                                if (oData.results.length < iBatchSize) {
                                    resolve(aAllData1);
                                } else {
                                    resolve(getAllData(iSkip + iBatchSize));
                                }
                            },
                            error: function (oError) {
                                reject(oError);
                            }
                        });
                    });
                }
                getAllData(0).then(function (aAllData1) {
                    // console.log("All data:", aAllData);
                    var aAllData3 = aAllData1;
                    var aAllData4 = aAllData2;
                    var aNewDeliveryWithMaterialArr = [];
                    aCreatedDelieryData.map(function (item1, ind1, arr1) {
                        var aLineItemData = item1.DeliveryItemData;
                        aLineItemData.map(function (item2, ind2, arr2) {
                            if (item2.SalesOrderItemCategory != "TAP") {
                                var obj = {
                                    "DeliveryDocument": item2.DeliveryDocument,
                                    "DeliveryDocumentItem": item2.DeliveryDocumentItem,
                                    "Material": item2.Material,
                                    "DeliveryQuantity": item2.DeliveryDocumentQuantity,
                                }
                                aNewDeliveryWithMaterialArr.push(obj);
                            }
                        })
                    })
                    var aNEwArr = [];
                    var resultArray = [];
                    aNewDeliveryWithMaterialArr.map(function (item1, ind1, arr1) {
                        var RequiredQuantity = parseFloat(item1.DeliveryQuantity);
                        var accumulatedQuantity = 0;
                        aAllData3.map(function (item2, ind2, arr2) {
                            if (item2.Product == item1.Material && (item2.Quantity != "" && item2.Quantity != "0" && item2.Quantity != "0.00") && accumulatedQuantity < RequiredQuantity) {
                                var currentQuantity = parseFloat(item2.Quantity);
                                var neededQuantity = RequiredQuantity - accumulatedQuantity;
                                if (currentQuantity >= neededQuantity) {
                                    var partialItem = {
                                        "DeliveryDocument": item1.DeliveryDocument,
                                        "DeliveryDocumentItem": item1.DeliveryDocumentItem,
                                        "Batch": item2.Batch,
                                        "Product": item2.Product,
                                        "Plant": item2.Plant,
                                        "MaterialBaseUnit": item2.MaterialBaseUnit,
                                        "Quantity": neededQuantity.toString(),
                                    };
                                    if (neededQuantity > 0) {
                                        resultArray.push(partialItem);
                                    }
                                    accumulatedQuantity += neededQuantity;
                                    item2.Quantity = currentQuantity - neededQuantity;
                                } else {
                                    var partialItem1 = {
                                        "DeliveryDocument": item1.DeliveryDocument,
                                        "DeliveryDocumentItem": item1.DeliveryDocumentItem,
                                        "Batch": item2.Batch,
                                        "Product": item2.Product,
                                        "Plant": item2.Plant,
                                        "MaterialBaseUnit": item2.MaterialBaseUnit,
                                        "Quantity": item2.Quantity,
                                    };
                                    resultArray.push(partialItem1);
                                    item2.Quantity = "0";
                                    accumulatedQuantity += currentQuantity;
                                }
                            }
                        })
                    })
                    $.ajax({
                        type: "GET",
                        url: "/sap/opu/odata/sap/API_OUTBOUND_DELIVERY_SRV;v=0002/A_OutbDeliveryItem",
                        async: true,
                        contentType: "application/json",
                        dataType: 'json',
                        beforeSend: function (xhr) {
                            xhr.setRequestHeader('X-CSRF-Token', 'fetch');
                        },
                        complete: function (response) {
                            const token = response.getResponseHeader('X-CSRF-Token');
                            resultArray.map(function (item, ind, arr) {
                                const Batch = item.Batch;
                                const Delivery = item.DeliveryDocument;
                                const DeliveryDocumentItem = item.DeliveryDocumentItem;
                                const ActualDeliveryQuantity = item.Quantity;
                                setTimeout(function () {
                                    $.ajax({
                                        type: "POST",
                                        url: "/sap/opu/odata/sap/API_OUTBOUND_DELIVERY_SRV;v=0002/CreateBatchSplitItem?PickQuantityInSalesUOM=0M&Batch='" + Batch + "'&DeliveryDocument='" + Delivery + "'&DeliveryDocumentItem='" + DeliveryDocumentItem + "'&ActualDeliveryQuantity=" + ActualDeliveryQuantity + "M&DeliveryQuantityUnit='PC'",
                                        async: true,
                                        headers: {
                                            "X-CSRF-TOKEN": token,
                                            "Accept": "application/json",
                                            "etag": "*",
                                            "If-Match": '*',
                                            "DataServiceVersion": "2.0",
                                            "Content-Type": "application/json",
                                            "Authorization": "Basic UFBfU01QTDAxOnFrSEZWSlplZHhQRERvfmlBdVhDVGhVTjRycFZGUkdKUFNXZWt6cGo=",
                                        },
                                        success: function (data) {
                                            // aresultArray_ErrorArr.push("");
                                            console.log("Success");
                                            if (ind == arr.length - 1) {
                                                oBusy.close();
                                                that.onGeneratePGIPress();
                                            }
                                        },
                                        error: function (error) {

                                            const message1 = (error.responseJSON.error.innererror.errordetails.length !== 0)
                                                ? error.responseJSON.error.innererror.errordetails[0].message
                                                : error.responseJSON.error.message.value;
                                            console.log(message1);
                                            // aresultArray_ErrorArr.push(message1);
                                        }
                                    });
                                }, 5000);

                            })
                        }
                    });
                    // oBusy.close();
                }).catch(function (oError) {
                    console.error("Failed to retrieve data:", oError);
                    oBusy.close();
                });

            },

            onGenerateBatchSplitWithPGIPress_Working_Properly: function (oEvent) {
                var oBusy = new sap.m.BusyDialog({
                    text: "Batch Spliting...."
                });
                oBusy.open();
                var that = this;
                const aCreatedDelieryData = that.getView().getModel("oDataModel").getProperty("/aSecondTableData");
                var oDataModel = new sap.ui.model.odata.v2.ODataModel("/sap/opu/odata/sap/ZDELIVERYCREATION_BIN");
                var that = this;
                var fetchedData = [];
                var oModel = new sap.ui.model.odata.v2.ODataModel("/sap/opu/odata/sap/ZDELIVERYCREATION_BIN", {
                    useBatch: true
                });
                var aAllData1 = [];
                var aAllData2 = [];
                var iBatchSize = 5000;
                function getAllData(iSkip) {
                    return new Promise(function (resolve, reject) {
                        oModel.read("/Batch_Determin", {
                            urlParameters: {
                                "$top": iBatchSize,
                                "$skip": iSkip
                            },
                            success: function (oData) {
                                aAllData1 = aAllData1.concat(oData.results);
                                aAllData2 = aAllData2.concat(oData.results);
                                if (oData.results.length < iBatchSize) {
                                    resolve(aAllData1);
                                } else {
                                    resolve(getAllData(iSkip + iBatchSize));
                                }
                            },
                            error: function (oError) {
                                reject(oError);
                            }
                        });
                    });
                }
                getAllData(0).then(function (aAllData1) {
                    var aAllData3 = aAllData1;
                    aAllData3.sort(function (a, b) {
                        return b.Quantity - a.Quantity || a.Product - b.Product;
                    });
                    var aAllData4 = aAllData2;
                    var aNewDeliveryWithMaterialArr = [];
                    aCreatedDelieryData.map(function (item1, ind1, arr1) {
                        var aLineItemData = item1.DeliveryItemData;
                        aLineItemData.map(function (item2, ind2, arr2) {
                            if (item2.SalesOrderItemCategory != "TAP") {
                                var obj = {
                                    "DeliveryDocument": item2.DeliveryDocument,
                                    "DeliveryDocumentItem": item2.DeliveryDocumentItem,
                                    "Material": item2.Material,
                                    "DeliveryQuantity": item2.DeliveryDocumentQuantity,
                                }
                                aNewDeliveryWithMaterialArr.push(obj);
                            }
                        })
                    })
                    var aNEwArr = [];
                    var resultArray = [];
                    aNewDeliveryWithMaterialArr.map(function (item1, ind1, arr1) {
                        var RequiredQuantity = parseFloat(item1.DeliveryQuantity);
                        var accumulatedQuantity = 0;
                        aAllData3.map(function (item2, ind2, arr2) {
                            if (item2.Product == item1.Material && (item2.Quantity != "" && item2.Quantity != "0" && item2.Quantity != "0.00") && accumulatedQuantity < RequiredQuantity) {
                                var currentQuantity = parseFloat(item2.Quantity);
                                var neededQuantity = RequiredQuantity - accumulatedQuantity;
                                if (currentQuantity >= neededQuantity) {
                                    var partialItem = {
                                        "DeliveryDocument": item1.DeliveryDocument,
                                        "DeliveryDocumentItem": item1.DeliveryDocumentItem,
                                        "Batch": item2.Batch,
                                        "Product": item2.Product,
                                        "Plant": item2.Plant,
                                        "MaterialBaseUnit": item2.MaterialBaseUnit,
                                        "Quantity": neededQuantity.toString(),
                                    };
                                    if (neededQuantity > 0) {
                                        resultArray.push(partialItem);
                                    }
                                    accumulatedQuantity += neededQuantity;
                                    item2.Quantity = currentQuantity - neededQuantity;
                                } else {
                                    var partialItem1 = {
                                        "DeliveryDocument": item1.DeliveryDocument,
                                        "DeliveryDocumentItem": item1.DeliveryDocumentItem,
                                        "Batch": item2.Batch,
                                        "Product": item2.Product,
                                        "Plant": item2.Plant,
                                        "MaterialBaseUnit": item2.MaterialBaseUnit,
                                        "Quantity": item2.Quantity,
                                    };
                                    resultArray.push(partialItem1);
                                    item2.Quantity = "0";
                                    accumulatedQuantity += currentQuantity;
                                }
                            }
                        })
                    })
                    $.ajax({
                        type: "GET",
                        url: "/sap/opu/odata/sap/API_OUTBOUND_DELIVERY_SRV;v=0002/A_OutbDeliveryItem",
                        async: true,
                        contentType: "application/json",
                        dataType: 'json',
                        beforeSend: function (xhr) {
                            xhr.setRequestHeader('X-CSRF-Token', 'fetch');
                        },
                        complete: function (response) {
                            const token = response.getResponseHeader('X-CSRF-Token');
                            async function processBatchSpliting(resultArray, that) {
                                const promises = [];
                                for (let index = 0; index < resultArray.length; index++) {
                                    const item = resultArray[index];
                                    const Batch = item.Batch;
                                    const Delivery = item.DeliveryDocument;
                                    const DeliveryDocumentItem = item.DeliveryDocumentItem;
                                    const ActualDeliveryQuantity = item.Quantity;
                                    const promise = new Promise((resolve, reject) => {
                                        $.ajax({
                                            type: "POST",
                                            url: "/sap/opu/odata/sap/API_OUTBOUND_DELIVERY_SRV;v=0002/CreateBatchSplitItem?PickQuantityInSalesUOM=0M&Batch='" + Batch + "'&DeliveryDocument='" + Delivery + "'&DeliveryDocumentItem='" + DeliveryDocumentItem + "'&ActualDeliveryQuantity=" + ActualDeliveryQuantity + "M&DeliveryQuantityUnit='PC'",
                                            async: false,
                                            headers: {
                                                "X-CSRF-TOKEN": token,
                                                "Accept": "application/json",
                                                "etag": "*",
                                                "If-Match": '*',
                                                "DataServiceVersion": "2.0",
                                                "Content-Type": "application/json",
                                                "Authorization": "Basic UFBfU01QTDAxOnFrSEZWSlplZHhQRERvfmlBdVhDVGhVTjRycFZGUkdKUFNXZWt6cGo=",
                                            },
                                            success: function (data) {
                                                resolve("Success");
                                            },
                                            error: function (error) {
                                                const message1 = (error.responseJSON.error.innererror.errordetails.length !== 0)
                                                    ? error.responseJSON.error.innererror.errordetails[0].message
                                                    : error.responseJSON.error.message.value;
                                                resolve("Error");
                                            }
                                        });

                                        // $.ajax({
                                        //     type: "GET",
                                        //     url: "/sap/opu/odata/sap/API_CUSTOMER_RETURNS_DELIVERY_SRV;v=0002/A_ReturnsDeliveryHeader",
                                        //     async: true,
                                        //     contentType: "application/json",
                                        //     dataType: 'json',
                                        //     beforeSend: function (xhr) {
                                        //         xhr.setRequestHeader('X-CSRF-Token', 'fetch');
                                        //     },
                                        //     complete: function (response) {
                                        //         const token = response.getResponseHeader('X-CSRF-Token');
                                        //         $.ajax({
                                        //             type: "POST",
                                        //             url: "/sap/opu/odata/sap/API_OUTBOUND_DELIVERY_SRV;v=0002/CreateBatchSplitItem?PickQuantityInSalesUOM=0M&Batch='" + Batch + "'&DeliveryDocument='" + Delivery + "'&DeliveryDocumentItem='" + DeliveryDocumentItem + "'&ActualDeliveryQuantity=" + ActualDeliveryQuantity + "M&DeliveryQuantityUnit='PC'",
                                        //             async: false,
                                        //             headers: {
                                        //                 "X-CSRF-TOKEN": token,
                                        //                 "Accept": "application/json",
                                        //                 "etag": "*",
                                        //                 "If-Match": '*',
                                        //                 "DataServiceVersion": "2.0",
                                        //                 "Content-Type": "application/json",
                                        //                 "Authorization": "Basic UFBfU01QTDAxOnFrSEZWSlplZHhQRERvfmlBdVhDVGhVTjRycFZGUkdKUFNXZWt6cGo=",
                                        //             },
                                        //             success: function (data) {
                                        //                 resolve("Success");
                                        //             },
                                        //             error: function (error) {
                                        //                 const message1 = (error.responseJSON.error.innererror.errordetails.length !== 0)
                                        //                     ? error.responseJSON.error.innererror.errordetails[0].message
                                        //                     : error.responseJSON.error.message.value;
                                        //                 resolve("Error");
                                        //             }
                                        //         });
                                        //     }
                                        // });
                                    });
                                    promises.push(promise);
                                    await promise; // Wait for the current promise to resolve before proceeding to the next one
                                }
                                const results = await Promise.all(promises);
                                const aTextArr = [];
                                aTextArr.push(...results);
                                oBusy.close();
                                that.onGeneratePGIPress();

                            }
                            processBatchSpliting(resultArray, that).catch((error) => {
                                console.error(error);
                            });
                        }
                    });
                    // oBusy.close();
                }).catch(function (oError) {
                    console.error("Failed to retrieve data:", oError);
                    oBusy.close();
                });

            },

            onGenerateBatchSplitPress: function (oEvent) {
                var oBusy = new sap.m.BusyDialog({
                    text: "Batch Spliting..."
                });
                oBusy.open();
                var that = this;
                that.getView().byId("idGenerateBatchSplitButton").setEnabled(false);
                const aLineItemData = that.getView().getModel("oDataModel").getProperty("/aTableData");
                const aCreatedDelieryData = that.getView().getModel("oDataModel").getProperty("/aSecondTableData");
                var aNewDeliveryWithMaterialArr = [];
                aCreatedDelieryData.map(function (item1, ind1, arr1) {
                    aLineItemData.map(function (item2, ind2, arr2) {
                        if (item2.SalesOrderItemCategory != "TAP") {
                            var obj = {
                                "DeliveryDocument": item1.DeliveryNumber,
                                "DeliveryNumberActive": true,
                                "Material": item2.MaterialCode,
                                "DeliveryQuantity": item2.DeliveryQuantity,
                                "DeliveryDocumentItem": "",
                            }
                            aNewDeliveryWithMaterialArr.push(obj);
                        }
                    })
                })
                var oDataModel = new sap.ui.model.odata.v2.ODataModel("/sap/opu/odata/sap/ZDELIVERYCREATION_BIN");
                function fetchItem(item3) {
                    return new Promise((resolve, reject) => {
                        oDataModel.read("/Delivery_Item_With_Material", {
                            filters: [
                                new sap.ui.model.Filter("DeliveryDocument", "EQ", item3.DeliveryDocument),
                                new sap.ui.model.Filter("Material", "EQ", item3.Material)
                            ],
                            success: oResponse => {
                                if (oResponse.results.length) item3.DeliveryDocumentItem = oResponse.results[0].DeliveryDocumentItem;
                                resolve();
                            },
                            error: () => reject("Fetch failed")
                        });
                    });
                }
                Promise.all(aNewDeliveryWithMaterialArr.map(fetchItem))
                    .then(function () {
                        console.log("All requests completed successfully");

                        $.ajax({
                            type: "GET",
                            url: "/sap/opu/odata/sap/API_OUTBOUND_DELIVERY_SRV;v=0002/A_OutbDeliveryItem",
                            async: true,
                            contentType: "application/json",
                            dataType: 'json',
                            beforeSend: function (xhr) {
                                xhr.setRequestHeader('X-CSRF-Token', 'fetch');
                            },
                            complete: function (response) {
                                const token = response.getResponseHeader('X-CSRF-Token');
                                var aNewDeliveryWithMaterialArr2 = aNewDeliveryWithMaterialArr;
                                var oModel = new sap.ui.model.odata.v2.ODataModel("/sap/opu/odata/sap/ZDELIVERYCREATION_BIN");

                                aNewDeliveryWithMaterialArr2.map(function (item4, ind4, arr4) {
                                    oModel.read("/Batch_Determin", {
                                        filters: [new sap.ui.model.Filter("Product", "EQ", item4.Material)],
                                        urlParameters: { "$top": "5000" },
                                        success: function (oRespo) {
                                            var resultArray = [];
                                            if (oRespo.results.length != 0) {
                                                var aNewArr = [];
                                                oRespo.results.map(function (item) {
                                                    if (item.Quantity != "" && item.Quantity != "0" && item.Quantity != "0.00") {
                                                        aNewArr.push(item);
                                                    }
                                                })
                                                var RequiredQuantity = parseFloat(item4.DeliveryQuantity);
                                                var accumulatedQuantity = 0;
                                                for (var i = 0; i < aNewArr.length && accumulatedQuantity < RequiredQuantity; i++) {
                                                    var currentQuantity = parseFloat(aNewArr[i].Quantity);
                                                    var neededQuantity = RequiredQuantity - accumulatedQuantity;
                                                    if (currentQuantity >= neededQuantity) {
                                                        var partialItem = {
                                                            "Batch": aNewArr[i].Batch,
                                                            "Product": item4.Material,
                                                            "Plant": aNewArr[i].Plant,
                                                            "MaterialBaseUnit": aNewArr[i].MaterialBaseUnit,
                                                            "Quantity": neededQuantity.toString(),
                                                        };
                                                        if (neededQuantity > 0) {
                                                            resultArray.push(partialItem);
                                                        }
                                                        accumulatedQuantity += neededQuantity;
                                                    } else {
                                                        resultArray.push(aNewArr[i]);
                                                        accumulatedQuantity += currentQuantity;
                                                    }
                                                }
                                                if (accumulatedQuantity < RequiredQuantity) {
                                                    var remainingQuantity = RequiredQuantity - accumulatedQuantity;
                                                    if (remainingQuantity > 0) {
                                                        var newItem = {
                                                            "Batch": "",
                                                            "MaterialBaseUnit": aNewArr[aNewArr.length - 1].MaterialBaseUnit,
                                                            "Product": item4.Material,
                                                            "Plant": "1100",
                                                            "Quantity": remainingQuantity.toString()
                                                        };
                                                        resultArray.push(newItem);
                                                    }
                                                }
                                                var aresultArray_ErrorArr = [];
                                                resultArray.map(function (items, index2, arr2) {
                                                    const Batch = items.Batch;
                                                    const Delivery = item4.DeliveryDocument;
                                                    const DeliveryDocumentItem = item4.DeliveryDocumentItem;
                                                    const ActualDeliveryQuantity = items.Quantity;
                                                    $.ajax({
                                                        type: "POST",
                                                        url: "/sap/opu/odata/sap/API_OUTBOUND_DELIVERY_SRV;v=0002/CreateBatchSplitItem?PickQuantityInSalesUOM=0M&Batch='" + Batch + "'&DeliveryDocument='" + Delivery + "'&DeliveryDocumentItem='" + DeliveryDocumentItem + "'&ActualDeliveryQuantity=" + ActualDeliveryQuantity + "M&DeliveryQuantityUnit='PC'",
                                                        async: false,
                                                        headers: {
                                                            "X-CSRF-TOKEN": token,
                                                            "Accept": "application/json",
                                                            "etag": "*",
                                                            "If-Match": '*',
                                                            "DataServiceVersion": "2.0",
                                                            "Content-Type": "application/json",
                                                            "Authorization": "Basic UFBfU01QTDAxOnFrSEZWSlplZHhQRERvfmlBdVhDVGhVTjRycFZGUkdKUFNXZWt6cGo=",
                                                        },
                                                        success: function (data) {
                                                            aresultArray_ErrorArr.push("");
                                                            if (index2 == arr2.length - 1) {
                                                            }
                                                            if ((ind4 == arr4.length - 1) && (index2 == arr2.length - 1)) {
                                                                oBusy.close();
                                                                that.getView().byId("idGenerateBatchSplitButton").setEnabled(true);
                                                            }
                                                        },
                                                        error: function (error) {

                                                            const message1 = (error.responseJSON.error.innererror.errordetails.length !== 0)
                                                                ? error.responseJSON.error.innererror.errordetails[0].message
                                                                : error.responseJSON.error.message.value;
                                                            console.log(message1);
                                                            aresultArray_ErrorArr.push(message1);
                                                            if (index2 == arr2.length - 1) {
                                                            }
                                                            if ((ind4 == arr4.length - 1) && (index2 == arr2.length - 1)) {
                                                                oBusy.close();
                                                                that.getView().byId("idGenerateBatchSplitButton").setEnabled(true);

                                                            }
                                                        }
                                                    });
                                                })
                                            }

                                        },
                                        error: () => {
                                            MessageBox.alert("Error");
                                        },
                                    });
                                })
                            }
                        });



                    })
                    .catch(function () {
                        console.log("Error Occur When Calling Data");
                    })
            },

            onGenerateBatchSplitWithPGIPress_old1: function () {
                var that = this;
                const aCreatedDelieryData = that.getView().getModel("oDataModel").getProperty("/aSecondTableData");
                var oDataModel = new sap.ui.model.odata.v2.ODataModel("/sap/opu/odata/sap/ZDELIVERYCREATION_BIN");
                $.ajax({
                    type: "GET",
                    url: "/sap/opu/odata/sap/API_OUTBOUND_DELIVERY_SRV;v=0002/A_OutbDeliveryItem",
                    async: true,
                    contentType: "application/json",
                    dataType: 'json',
                    beforeSend: function (xhr) {
                        xhr.setRequestHeader('X-CSRF-Token', 'fetch');
                    },
                    complete: function (response) {
                        const token = response.getResponseHeader('X-CSRF-Token');
                        aCreatedDelieryData.map(function (item1, ind1, arr1) {
                            var DeliveryDocumentNumber = item1.DeliveryNumber;
                            var aCreatedDelieryItemData = item1.DeliveryItemData;
                            aCreatedDelieryItemData.map(function (item2, ind2, arr2) {
                                var DeliveryDocumentItems = item2.DeliveryDocumentItem;
                                var RequiredQuantity = parseFloat(item2.DeliveryDocumentQuantity);
                                var Material = item2.Material;
                                oDataModel.read("/Batch_Determin", {
                                    filters: [new sap.ui.model.Filter("Product", "EQ", Material)],
                                    urlParameters: { "$top": "5000" },
                                    success: function (oRespo) {
                                        var resultArray = [];
                                        if (oRespo.results.length != 0) {
                                            var aNewArr = [];
                                            oRespo.results.map(function (item) {
                                                if (item.Quantity != "" && item.Quantity != "0" && item.Quantity != "0.00") {
                                                    aNewArr.push(item);
                                                }
                                            })
                                            var accumulatedQuantity = 0;
                                            for (var i = 0; i < aNewArr.length && accumulatedQuantity < RequiredQuantity; i++) {
                                                var currentQuantity = parseFloat(aNewArr[i].Quantity);
                                                var neededQuantity = RequiredQuantity - accumulatedQuantity;
                                                if (currentQuantity >= neededQuantity) {
                                                    var partialItem = {
                                                        "Batch": aNewArr[i].Batch,
                                                        "Product": Material,
                                                        "Plant": aNewArr[i].Plant,
                                                        "MaterialBaseUnit": aNewArr[i].MaterialBaseUnit,
                                                        "Quantity": neededQuantity.toString(),
                                                    };
                                                    if (neededQuantity > 0) {
                                                        resultArray.push(partialItem);
                                                    }
                                                    accumulatedQuantity += neededQuantity;
                                                } else {
                                                    resultArray.push(aNewArr[i]);
                                                    accumulatedQuantity += currentQuantity;
                                                }
                                            }
                                            if (accumulatedQuantity < RequiredQuantity) {
                                                var remainingQuantity = RequiredQuantity - accumulatedQuantity;
                                                if (remainingQuantity > 0) {
                                                    var newItem = {
                                                        "Batch": "",
                                                        "MaterialBaseUnit": aNewArr[aNewArr.length - 1].MaterialBaseUnit,
                                                        "Product": Material,
                                                        "Plant": "1100",
                                                        "Quantity": remainingQuantity.toString()
                                                    };
                                                    resultArray.push(newItem);
                                                }
                                            }
                                            var aresultArray_ErrorArr = [];
                                            resultArray.map(function (item3, ind3, arr3) {
                                                const Batch = item3.Batch;
                                                const Delivery = DeliveryDocumentNumber;
                                                const DeliveryDocumentItem = DeliveryDocumentItems;
                                                const ActualDeliveryQuantity = item3.Quantity;
                                                $.ajax({
                                                    type: "POST",
                                                    url: "/sap/opu/odata/sap/API_OUTBOUND_DELIVERY_SRV;v=0002/CreateBatchSplitItem?PickQuantityInSalesUOM=0M&Batch='" + Batch + "'&DeliveryDocument='" + Delivery + "'&DeliveryDocumentItem='" + DeliveryDocumentItem + "'&ActualDeliveryQuantity=" + ActualDeliveryQuantity + "M&DeliveryQuantityUnit='PC'",
                                                    async: true,
                                                    headers: {
                                                        "X-CSRF-TOKEN": token,
                                                        "Accept": "application/json",
                                                        "etag": "*",
                                                        "If-Match": '*',
                                                        "DataServiceVersion": "2.0",
                                                        "Content-Type": "application/json",
                                                        "Authorization": "Basic UFBfU01QTDAxOnFrSEZWSlplZHhQRERvfmlBdVhDVGhVTjRycFZGUkdKUFNXZWt6cGo="
                                                    },
                                                    success: function (data) {
                                                        aresultArray_ErrorArr.push("");
                                                        if ((ind2 == arr2.length - 1) && (ind3 == arr3.length - 1)) {

                                                            $.ajax({
                                                                type: "POST",
                                                                url: "/sap/opu/odata/sap/API_OUTBOUND_DELIVERY_SRV;v=0002/PostGoodsIssue?DeliveryDocument=" + "'" + Delivery + "'",
                                                                async: true,
                                                                headers: {
                                                                    "X-CSRF-TOKEN": token,
                                                                    "Accept": "application/json",
                                                                    "etag": "*",
                                                                    "If-Match": '*',
                                                                    "DataServiceVersion": "2.0",
                                                                    "Content-Type": "application/json",
                                                                    "Authorization": "Basic UFBfU01QTDAxOnFrSEZWSlplZHhQRERvfmlBdVhDVGhVTjRycFZGUkdKUFNXZWt6cGo="
                                                                },
                                                                success: function (data) {
                                                                    var SalesOrderArr = that.getView().getModel("oDataModel").getProperty("/aSecondTableData");
                                                                    SalesOrderArr[ind1].PGIStatus = "Success";
                                                                    SalesOrderArr[ind1].Error = "";
                                                                    that.getView().getModel("oDataModel").setProperty("/aSecondTableData", SalesOrderArr);
                                                                },
                                                                error: function (error) {
                                                                    const message1 = (error.responseJSON.error.innererror.errordetails.length !== 0) ?
                                                                        error.responseJSON.error.innererror.errordetails[0].message :
                                                                        error.responseJSON.error.message.value;
                                                                    var SalesOrderArr = that.getView().getModel("oDataModel").getProperty("/aSecondTableData");
                                                                    SalesOrderArr[ind1].PGIStatus = "Error";
                                                                    SalesOrderArr[ind1].Error = message1;
                                                                    that.getView().getModel("oDataModel").setProperty("/aSecondTableData", SalesOrderArr);
                                                                }
                                                            });
                                                        }
                                                        if ((ind1 == arr1.length - 1) && (ind2 == arr2.length - 1) && (ind3 == arr3.length - 1)) {
                                                            that.getView().byId("idGenerateBatchSplitButton").setEnabled(true);
                                                            oBusy.close();
                                                        }
                                                    },
                                                    error: function (error) {
                                                        const message1 = (error.responseJSON.error.innererror.errordetails.length !== 0) ?
                                                            error.responseJSON.error.innererror.errordetails[0].message :
                                                            error.responseJSON.error.message.value;
                                                        console.log(message1);
                                                    }
                                                });
                                            })
                                        }

                                    },
                                    error: () => {
                                        MessageBox.alert("Error");
                                    },
                                });
                            })
                        })
                    }
                });
            },


            onGenerateBatchSplitWithPGIPress_old1: function () {
                var that = this;
                const aCreatedDelieryData = that.getView().getModel("oDataModel").getProperty("/aSecondTableData");
                var oDataModel = new sap.ui.model.odata.v2.ODataModel("/sap/opu/odata/sap/ZDELIVERYCREATION_BIN");
                $.ajax({
                    type: "GET",
                    url: "/sap/opu/odata/sap/API_OUTBOUND_DELIVERY_SRV;v=0002/A_OutbDeliveryItem",
                    async: true,
                    contentType: "application/json",
                    dataType: 'json',
                    beforeSend: function (xhr) {
                        xhr.setRequestHeader('X-CSRF-Token', 'fetch');
                    },
                    complete: function (response) {
                        const token = response.getResponseHeader('X-CSRF-Token');
                        aCreatedDelieryData.map(function (item1, ind1, arr1) {
                            var DeliveryDocumentNumber = item1.DeliveryNumber;
                            var aCreatedDelieryItemData = item1.DeliveryItemData;
                            aCreatedDelieryItemData.map(function (item2, ind2, arr2) {
                                var DeliveryDocumentItems = item2.DeliveryDocumentItem;
                                var RequiredQuantity = parseFloat(item2.DeliveryDocumentQuantity);
                                var Material = item2.Material;
                                oDataModel.read("/Batch_Determin", {
                                    filters: [new sap.ui.model.Filter("Product", "EQ", Material)],
                                    urlParameters: { "$top": "5000" },
                                    success: function (oRespo) {
                                        var resultArray = [];
                                        if (oRespo.results.length != 0) {
                                            var aNewArr = [];
                                            oRespo.results.map(function (item) {
                                                if (item.Quantity != "" && item.Quantity != "0" && item.Quantity != "0.00") {
                                                    aNewArr.push(item);
                                                }
                                            })
                                            var accumulatedQuantity = 0;
                                            for (var i = 0; i < aNewArr.length && accumulatedQuantity < RequiredQuantity; i++) {
                                                var currentQuantity = parseFloat(aNewArr[i].Quantity);
                                                var neededQuantity = RequiredQuantity - accumulatedQuantity;
                                                if (currentQuantity >= neededQuantity) {
                                                    var partialItem = {
                                                        "Batch": aNewArr[i].Batch,
                                                        "Product": Material,
                                                        "Plant": aNewArr[i].Plant,
                                                        "MaterialBaseUnit": aNewArr[i].MaterialBaseUnit,
                                                        "Quantity": neededQuantity.toString(),
                                                    };
                                                    if (neededQuantity > 0) {
                                                        resultArray.push(partialItem);
                                                    }
                                                    accumulatedQuantity += neededQuantity;
                                                } else {
                                                    resultArray.push(aNewArr[i]);
                                                    accumulatedQuantity += currentQuantity;
                                                }
                                            }
                                            // if (accumulatedQuantity < RequiredQuantity) {
                                            //     var remainingQuantity = RequiredQuantity - accumulatedQuantity;
                                            //     if (remainingQuantity > 0) {
                                            //         var newItem = {
                                            //             "Batch": "",
                                            //             "MaterialBaseUnit": aNewArr[aNewArr.length - 1].MaterialBaseUnit,
                                            //             "Product": Material,
                                            //             "Plant": "1100",
                                            //             "Quantity": remainingQuantity.toString()
                                            //         };
                                            //         resultArray.push(newItem);
                                            //     }
                                            // }
                                            var aresultArray_ErrorArr = [];
                                            resultArray.map(function (item3, ind3, arr3) {
                                                const Batch = item3.Batch;
                                                const Delivery = DeliveryDocumentNumber;
                                                const DeliveryDocumentItem = DeliveryDocumentItems;
                                                const ActualDeliveryQuantity = item3.Quantity;

                                                // setTimeout(function () {
                                                $.ajax({
                                                    type: "POST",
                                                    url: "/sap/opu/odata/sap/API_OUTBOUND_DELIVERY_SRV;v=0002/CreateBatchSplitItem?PickQuantityInSalesUOM=0M&Batch='" + Batch + "'&DeliveryDocument='" + Delivery + "'&DeliveryDocumentItem='" + DeliveryDocumentItem + "'&ActualDeliveryQuantity=" + ActualDeliveryQuantity + "M&DeliveryQuantityUnit='PC'",
                                                    async: false,
                                                    headers: {
                                                        "X-CSRF-TOKEN": token,
                                                        "Accept": "application/json",
                                                        "etag": "*",
                                                        "If-Match": '*',
                                                        "DataServiceVersion": "2.0",
                                                        "Content-Type": "application/json",
                                                        "Authorization": "Basic UFBfU01QTDAxOnFrSEZWSlplZHhQRERvfmlBdVhDVGhVTjRycFZGUkdKUFNXZWt6cGo="
                                                    },
                                                    success: function (data) {
                                                        aresultArray_ErrorArr.push("");
                                                        if ((ind2 == arr2.length - 1) && (ind3 == arr3.length - 1)) {
                                                            setTimeout(function () {
                                                                $.ajax({
                                                                    type: "POST",
                                                                    url: "/sap/opu/odata/sap/API_OUTBOUND_DELIVERY_SRV;v=0002/PostGoodsIssue?DeliveryDocument=" + "'" + Delivery + "'",
                                                                    async: true,
                                                                    headers: {
                                                                        "X-CSRF-TOKEN": token,
                                                                        "Accept": "application/json",
                                                                        "etag": "*",
                                                                        "If-Match": '*',
                                                                        "DataServiceVersion": "2.0",
                                                                        "Content-Type": "application/json",
                                                                        "Authorization": "Basic UFBfU01QTDAxOnFrSEZWSlplZHhQRERvfmlBdVhDVGhVTjRycFZGUkdKUFNXZWt6cGo="
                                                                    },
                                                                    success: function (data) {
                                                                        var SalesOrderArr = that.getView().getModel("oDataModel").getProperty("/aSecondTableData");
                                                                        SalesOrderArr[ind1].PGIStatus = "Success";
                                                                        SalesOrderArr[ind1].Error = "";
                                                                        that.getView().getModel("oDataModel").setProperty("/aSecondTableData", SalesOrderArr);
                                                                    },
                                                                    error: function (error) {
                                                                        const message1 = (error.responseJSON.error.innererror.errordetails.length !== 0) ?
                                                                            error.responseJSON.error.innererror.errordetails[0].message :
                                                                            error.responseJSON.error.message.value;
                                                                        var SalesOrderArr = that.getView().getModel("oDataModel").getProperty("/aSecondTableData");
                                                                        SalesOrderArr[ind1].PGIStatus = "Error";
                                                                        SalesOrderArr[ind1].Error = message1;
                                                                        that.getView().getModel("oDataModel").setProperty("/aSecondTableData", SalesOrderArr);
                                                                    }
                                                                });
                                                            }, 3000);
                                                        }
                                                        if ((ind1 == arr1.length - 1) && (ind2 == arr2.length - 1) && (ind3 == arr3.length - 1)) {
                                                            that.getView().byId("idGenerateBatchSplitButton").setEnabled(true);
                                                            oBusy.close();
                                                        }
                                                    },
                                                    error: function (error) {
                                                        const message1 = (error.responseJSON.error.innererror.errordetails.length !== 0) ?
                                                            error.responseJSON.error.innererror.errordetails[0].message :
                                                            error.responseJSON.error.message.value;
                                                        console.log(message1);
                                                    }
                                                });
                                                // }, 2000);

                                            })
                                        }

                                    },
                                    error: () => {
                                        MessageBox.alert("Error");
                                    },
                                });
                            })
                        })
                    }
                });
            },

            onGenerateBatchSplitWithPGIPress_old2: function () {
                var that = this;
                const aCreatedDelieryData = that.getView().getModel("oDataModel").getProperty("/aSecondTableData");
                var oDataModel = new sap.ui.model.odata.v2.ODataModel("/sap/opu/odata/sap/ZDELIVERYCREATION_BIN");
                $.ajax({
                    type: "GET",
                    url: "/sap/opu/odata/sap/API_OUTBOUND_DELIVERY_SRV;v=0002/A_OutbDeliveryItem",
                    async: true,
                    contentType: "application/json",
                    dataType: 'json',
                    beforeSend: function (xhr) {
                        xhr.setRequestHeader('X-CSRF-Token', 'fetch');
                    },
                    complete: function (response) {
                        const token = response.getResponseHeader('X-CSRF-Token');
                        aCreatedDelieryData.map(function (item1, ind1, arr1) {
                            var DeliveryDocumentNumber = item1.DeliveryNumber;
                            var aCreatedDelieryItemData = item1.DeliveryItemData;
                            aCreatedDelieryItemData.map(function (item2, ind2, arr2) {
                                var DeliveryDocumentItems = item2.DeliveryDocumentItem;
                                var RequiredQuantity = parseFloat(item2.DeliveryDocumentQuantity);
                                var Material = item2.Material;
                                oDataModel.read("/Batch_Determin", {
                                    filters: [new sap.ui.model.Filter("Product", "EQ", Material)],
                                    urlParameters: { "$top": "5000" },
                                    success: function (oRespo) {
                                        var resultArray = [];
                                        if (oRespo.results.length != 0) {
                                            var aNewArr = [];
                                            oRespo.results.map(function (item) {
                                                if (item.Quantity != "" && item.Quantity != "0" && item.Quantity != "0.00") {
                                                    aNewArr.push(item);
                                                }
                                            })
                                            var accumulatedQuantity = 0;
                                            for (var i = 0; i < aNewArr.length && accumulatedQuantity < RequiredQuantity; i++) {
                                                var currentQuantity = parseFloat(aNewArr[i].Quantity);
                                                var neededQuantity = RequiredQuantity - accumulatedQuantity;
                                                if (currentQuantity >= neededQuantity) {
                                                    var partialItem = {
                                                        "Batch": aNewArr[i].Batch,
                                                        "Product": Material,
                                                        "Plant": aNewArr[i].Plant,
                                                        "MaterialBaseUnit": aNewArr[i].MaterialBaseUnit,
                                                        "Quantity": neededQuantity.toString(),
                                                    };
                                                    if (neededQuantity > 0) {
                                                        resultArray.push(partialItem);
                                                    }
                                                    accumulatedQuantity += neededQuantity;
                                                } else {
                                                    resultArray.push(aNewArr[i]);
                                                    accumulatedQuantity += currentQuantity;
                                                }
                                            }
                                            // if (accumulatedQuantity < RequiredQuantity) {
                                            //     var remainingQuantity = RequiredQuantity - accumulatedQuantity;
                                            //     if (remainingQuantity > 0) {
                                            //         var newItem = {
                                            //             "Batch": "",
                                            //             "MaterialBaseUnit": aNewArr[aNewArr.length - 1].MaterialBaseUnit,
                                            //             "Product": Material,
                                            //             "Plant": "1100",
                                            //             "Quantity": remainingQuantity.toString()
                                            //         };
                                            //         resultArray.push(newItem);
                                            //     }
                                            // }
                                            var aresultArray_ErrorArr = [];
                                            resultArray.map(function (item3, ind3, arr3) {
                                                const Batch = item3.Batch;
                                                const Delivery = DeliveryDocumentNumber;
                                                const DeliveryDocumentItem = DeliveryDocumentItems;
                                                const ActualDeliveryQuantity = item3.Quantity;

                                                // setTimeout(function () {
                                                $.ajax({
                                                    type: "POST",
                                                    url: "/sap/opu/odata/sap/API_OUTBOUND_DELIVERY_SRV;v=0002/CreateBatchSplitItem?PickQuantityInSalesUOM=0M&Batch='" + Batch + "'&DeliveryDocument='" + Delivery + "'&DeliveryDocumentItem='" + DeliveryDocumentItem + "'&ActualDeliveryQuantity=" + ActualDeliveryQuantity + "M&DeliveryQuantityUnit='PC'",
                                                    async: false,
                                                    headers: {
                                                        "X-CSRF-TOKEN": token,
                                                        "Accept": "application/json",
                                                        "etag": "*",
                                                        "If-Match": '*',
                                                        "DataServiceVersion": "2.0",
                                                        "Content-Type": "application/json",
                                                        "Authorization": "Basic UFBfU01QTDAxOnFrSEZWSlplZHhQRERvfmlBdVhDVGhVTjRycFZGUkdKUFNXZWt6cGo="
                                                    },
                                                    success: function (data) {
                                                        aresultArray_ErrorArr.push("");
                                                        if ((ind2 == arr2.length - 1) && (ind3 == arr3.length - 1)) {
                                                            setTimeout(function () {
                                                                $.ajax({
                                                                    type: "POST",
                                                                    url: "/sap/opu/odata/sap/API_OUTBOUND_DELIVERY_SRV;v=0002/PostGoodsIssue?DeliveryDocument=" + "'" + Delivery + "'",
                                                                    async: true,
                                                                    headers: {
                                                                        "X-CSRF-TOKEN": token,
                                                                        "Accept": "application/json",
                                                                        "etag": "*",
                                                                        "If-Match": '*',
                                                                        "DataServiceVersion": "2.0",
                                                                        "Content-Type": "application/json",
                                                                        "Authorization": "Basic UFBfU01QTDAxOnFrSEZWSlplZHhQRERvfmlBdVhDVGhVTjRycFZGUkdKUFNXZWt6cGo="
                                                                    },
                                                                    success: function (data) {
                                                                        var SalesOrderArr = that.getView().getModel("oDataModel").getProperty("/aSecondTableData");
                                                                        SalesOrderArr[ind1].PGIStatus = "Success";
                                                                        SalesOrderArr[ind1].Error = "";
                                                                        that.getView().getModel("oDataModel").setProperty("/aSecondTableData", SalesOrderArr);
                                                                    },
                                                                    error: function (error) {
                                                                        const message1 = (error.responseJSON.error.innererror.errordetails.length !== 0) ?
                                                                            error.responseJSON.error.innererror.errordetails[0].message :
                                                                            error.responseJSON.error.message.value;
                                                                        var SalesOrderArr = that.getView().getModel("oDataModel").getProperty("/aSecondTableData");
                                                                        SalesOrderArr[ind1].PGIStatus = "Error";
                                                                        SalesOrderArr[ind1].Error = message1;
                                                                        that.getView().getModel("oDataModel").setProperty("/aSecondTableData", SalesOrderArr);
                                                                    }
                                                                });
                                                            }, 3000);
                                                        }
                                                        if ((ind1 == arr1.length - 1) && (ind2 == arr2.length - 1) && (ind3 == arr3.length - 1)) {
                                                            that.getView().byId("idGenerateBatchSplitButton").setEnabled(true);
                                                            oBusy.close();
                                                        }
                                                    },
                                                    error: function (error) {
                                                        const message1 = (error.responseJSON.error.innererror.errordetails.length !== 0) ?
                                                            error.responseJSON.error.innererror.errordetails[0].message :
                                                            error.responseJSON.error.message.value;
                                                        console.log(message1);
                                                    }
                                                });
                                                // }, 2000);

                                            })
                                        }

                                    },
                                    error: () => {
                                        MessageBox.alert("Error");
                                    },
                                });
                            })
                        })
                    }
                });
            },
            onGenerateBatchSplitWithPGIPress_old3: function () {
                var that = this;
                const aCreatedDelieryData = that.getView().getModel("oDataModel").getProperty("/aSecondTableData");
                var oDataModel = new sap.ui.model.odata.v2.ODataModel("/sap/opu/odata/sap/ZDELIVERYCREATION_BIN");
                $.ajax({
                    type: "GET",
                    url: "/sap/opu/odata/sap/API_OUTBOUND_DELIVERY_SRV;v=0002/A_OutbDeliveryItem",
                    async: true,
                    contentType: "application/json",
                    dataType: 'json',
                    beforeSend: function (xhr) {
                        xhr.setRequestHeader('X-CSRF-Token', 'fetch');
                    },
                    complete: function (response) {
                        const token = response.getResponseHeader('X-CSRF-Token');
                        aCreatedDelieryData.map(function (item1, ind1, arr1) {
                            var DeliveryDocumentNumber = item1.DeliveryNumber;
                            var aCreatedDelieryItemData = item1.DeliveryItemData;
                            aCreatedDelieryItemData.map(function (item2, ind2, arr2) {
                                var DeliveryDocumentItems = item2.DeliveryDocumentItem;
                                var RequiredQuantity = parseFloat(item2.DeliveryDocumentQuantity);
                                var Material = item2.Material;
                                oDataModel.read("/Batch_Determin", {
                                    filters: [new sap.ui.model.Filter("Product", "EQ", Material)],
                                    urlParameters: { "$top": "5000" },
                                    success: function (oRespo) {
                                        var resultArray = [];
                                        if (oRespo.results.length != 0) {
                                            var aNewArr = [];
                                            oRespo.results.map(function (item) {
                                                if (item.Quantity != "" && item.Quantity != "0" && item.Quantity != "0.00") {
                                                    aNewArr.push(item);
                                                }
                                            })
                                            var accumulatedQuantity = 0;
                                            for (var i = 0; i < aNewArr.length && accumulatedQuantity < RequiredQuantity; i++) {
                                                var currentQuantity = parseFloat(aNewArr[i].Quantity);
                                                var neededQuantity = RequiredQuantity - accumulatedQuantity;
                                                if (currentQuantity >= neededQuantity) {
                                                    var partialItem = {
                                                        "Batch": aNewArr[i].Batch,
                                                        "Product": Material,
                                                        "Plant": aNewArr[i].Plant,
                                                        "MaterialBaseUnit": aNewArr[i].MaterialBaseUnit,
                                                        "Quantity": neededQuantity.toString(),
                                                    };
                                                    if (neededQuantity > 0) {
                                                        resultArray.push(partialItem);
                                                    }
                                                    accumulatedQuantity += neededQuantity;
                                                } else {
                                                    resultArray.push(aNewArr[i]);
                                                    accumulatedQuantity += currentQuantity;
                                                }
                                            }

                                            function BatchSplit(item3) {
                                                return new Promise((resolve, reject) => {
                                                    const Batch = item3.Batch;
                                                    const Delivery = DeliveryDocumentNumber;
                                                    const DeliveryDocumentItem = DeliveryDocumentItems;
                                                    const ActualDeliveryQuantity = item3.Quantity;
                                                    $.ajax({
                                                        type: "POST",
                                                        url: "/sap/opu/odata/sap/API_OUTBOUND_DELIVERY_SRV;v=0002/CreateBatchSplitItem?PickQuantityInSalesUOM=0M&Batch='" + Batch + "'&DeliveryDocument='" + Delivery + "'&DeliveryDocumentItem='" + DeliveryDocumentItem + "'&ActualDeliveryQuantity=" + ActualDeliveryQuantity + "M&DeliveryQuantityUnit='PC'",
                                                        async: false,
                                                        headers: {
                                                            "X-CSRF-TOKEN": token,
                                                            "Accept": "application/json",
                                                            "etag": "*",
                                                            "If-Match": '*',
                                                            "DataServiceVersion": "2.0",
                                                            "Content-Type": "application/json",
                                                            "Authorization": "Basic UFBfU01QTDAxOnFrSEZWSlplZHhQRERvfmlBdVhDVGhVTjRycFZGUkdKUFNXZWt6cGo="
                                                        },
                                                        success: function (data) {
                                                            resolve("Done");
                                                        },
                                                        error: function (error) {
                                                            const message1 = (error.responseJSON.error.innererror.errordetails.length !== 0) ?
                                                                error.responseJSON.error.innererror.errordetails[0].message :
                                                                error.responseJSON.error.message.value;
                                                            console.log(message1);
                                                            resolve();

                                                        }
                                                    });
                                                });
                                            }
                                            Promise.all(resultArray.map(BatchSplit))
                                                .then(function () {
                                                    console.log("All requests completed successfully");
                                                    $.ajax({
                                                        type: "POST",
                                                        url: "/sap/opu/odata/sap/API_OUTBOUND_DELIVERY_SRV;v=0002/PostGoodsIssue?DeliveryDocument=" + "'" + DeliveryDocumentNumber + "'",
                                                        async: true,
                                                        headers: {
                                                            "X-CSRF-TOKEN": token,
                                                            "Accept": "application/json",
                                                            "etag": "*",
                                                            "If-Match": '*',
                                                            "DataServiceVersion": "2.0",
                                                            "Content-Type": "application/json",
                                                            "Authorization": "Basic UFBfU01QTDAxOnFrSEZWSlplZHhQRERvfmlBdVhDVGhVTjRycFZGUkdKUFNXZWt6cGo="
                                                        },
                                                        success: function (data) {
                                                            var SalesOrderArr = that.getView().getModel("oDataModel").getProperty("/aSecondTableData");
                                                            SalesOrderArr[ind1].PGIStatus = "Success";
                                                            SalesOrderArr[ind1].Error = "";
                                                            that.getView().getModel("oDataModel").setProperty("/aSecondTableData", SalesOrderArr);
                                                        },
                                                        error: function (error) {
                                                            const message1 = (error.responseJSON.error.innererror.errordetails.length !== 0) ?
                                                                error.responseJSON.error.innererror.errordetails[0].message :
                                                                error.responseJSON.error.message.value;
                                                            var SalesOrderArr = that.getView().getModel("oDataModel").getProperty("/aSecondTableData");
                                                            SalesOrderArr[ind1].PGIStatus = "Error";
                                                            SalesOrderArr[ind1].Error = message1;
                                                            that.getView().getModel("oDataModel").setProperty("/aSecondTableData", SalesOrderArr);
                                                        }
                                                    });
                                                })
                                                .catch(function () {
                                                    console.log("Error Occur When Calling Data");
                                                })
                                        }

                                    },
                                    error: () => {
                                        MessageBox.alert("Error");
                                    },
                                });
                            })
                        })
                    }
                });
            },

            onGenerateBatchSplitWithPGIPress_old4: function () {
                var that = this;
                const aCreatedDelieryData = that.getView().getModel("oDataModel").getProperty("/aSecondTableData");
                var oDataModel = new sap.ui.model.odata.v2.ODataModel("/sap/opu/odata/sap/ZDELIVERYCREATION_BIN");
                $.ajax({
                    type: "GET",
                    url: "/sap/opu/odata/sap/API_OUTBOUND_DELIVERY_SRV;v=0002/A_OutbDeliveryItem",
                    async: true,
                    contentType: "application/json",
                    dataType: 'json',
                    beforeSend: function (xhr) {
                        xhr.setRequestHeader('X-CSRF-Token', 'fetch');
                    },
                    complete: function (response) {
                        const token = response.getResponseHeader('X-CSRF-Token');
                        aCreatedDelieryData.map(function (item1, ind1, arr1) {
                            var DeliveryDocumentNumber = item1.DeliveryNumber;
                            var aCreatedDelieryItemData = item1.DeliveryItemData;
                            aCreatedDelieryItemData.map(function (item2, ind2, arr2) {
                                var DeliveryDocumentItems = item2.DeliveryDocumentItem;
                                var RequiredQuantity = parseFloat(item2.DeliveryDocumentQuantity);
                                var Material = item2.Material;
                                oDataModel.read("/Batch_Determin", {
                                    filters: [new sap.ui.model.Filter("Product", "EQ", Material)],
                                    urlParameters: { "$top": "5000" },
                                    success: function (oRespo) {
                                        var resultArray = [];
                                        if (oRespo.results.length != 0) {
                                            var aNewArr = [];
                                            oRespo.results.map(function (item) {
                                                if (item.Quantity != "" && item.Quantity != "0" && item.Quantity != "0.00") {
                                                    aNewArr.push(item);
                                                }
                                            })
                                            var accumulatedQuantity = 0;
                                            for (var i = 0; i < aNewArr.length && accumulatedQuantity < RequiredQuantity; i++) {
                                                var currentQuantity = parseFloat(aNewArr[i].Quantity);
                                                var neededQuantity = RequiredQuantity - accumulatedQuantity;
                                                if (currentQuantity >= neededQuantity) {
                                                    var partialItem = {
                                                        "Batch": aNewArr[i].Batch,
                                                        "Product": Material,
                                                        "Plant": aNewArr[i].Plant,
                                                        "MaterialBaseUnit": aNewArr[i].MaterialBaseUnit,
                                                        "Quantity": neededQuantity.toString(),
                                                    };
                                                    if (neededQuantity > 0) {
                                                        resultArray.push(partialItem);
                                                    }
                                                    accumulatedQuantity += neededQuantity;
                                                } else {
                                                    resultArray.push(aNewArr[i]);
                                                    accumulatedQuantity += currentQuantity;
                                                }
                                            }
                                            var aresultArray_ErrorArr = [];
                                            resultArray.map(function (item3, ind3, arr3) {
                                                const Batch = item3.Batch;
                                                const Delivery = DeliveryDocumentNumber;
                                                const DeliveryDocumentItem = DeliveryDocumentItems;
                                                const ActualDeliveryQuantity = item3.Quantity;
                                                setTimeout(function () {
                                                    $.ajax({
                                                        type: "POST",
                                                        url: "/sap/opu/odata/sap/API_OUTBOUND_DELIVERY_SRV;v=0002/CreateBatchSplitItem?PickQuantityInSalesUOM=0M&Batch='" + Batch + "'&DeliveryDocument='" + Delivery + "'&DeliveryDocumentItem='" + DeliveryDocumentItem + "'&ActualDeliveryQuantity=" + ActualDeliveryQuantity + "M&DeliveryQuantityUnit='PC'",
                                                        async: false,
                                                        headers: {
                                                            "X-CSRF-TOKEN": token,
                                                            "Accept": "application/json",
                                                            "etag": "*",
                                                            "If-Match": '*',
                                                            "DataServiceVersion": "2.0",
                                                            "Content-Type": "application/json",
                                                            "Authorization": "Basic UFBfU01QTDAxOnFrSEZWSlplZHhQRERvfmlBdVhDVGhVTjRycFZGUkdKUFNXZWt6cGo="
                                                        },
                                                        success: function (data) {
                                                            aresultArray_ErrorArr.push("");
                                                            if ((ind2 == arr2.length - 1) && (ind3 == arr3.length - 1)) {
                                                                setTimeout(function () {
                                                                    $.ajax({
                                                                        type: "POST",
                                                                        url: "/sap/opu/odata/sap/API_OUTBOUND_DELIVERY_SRV;v=0002/PostGoodsIssue?DeliveryDocument=" + "'" + Delivery + "'",
                                                                        async: true,
                                                                        headers: {
                                                                            "X-CSRF-TOKEN": token,
                                                                            "Accept": "application/json",
                                                                            "etag": "*",
                                                                            "If-Match": '*',
                                                                            "DataServiceVersion": "2.0",
                                                                            "Content-Type": "application/json",
                                                                            "Authorization": "Basic UFBfU01QTDAxOnFrSEZWSlplZHhQRERvfmlBdVhDVGhVTjRycFZGUkdKUFNXZWt6cGo="
                                                                        },
                                                                        success: function (data) {
                                                                            var SalesOrderArr = that.getView().getModel("oDataModel").getProperty("/aSecondTableData");
                                                                            SalesOrderArr[ind1].PGIStatus = "Success";
                                                                            SalesOrderArr[ind1].Error = "";
                                                                            that.getView().getModel("oDataModel").setProperty("/aSecondTableData", SalesOrderArr);
                                                                        },
                                                                        error: function (error) {
                                                                            const message1 = (error.responseJSON.error.innererror.errordetails.length !== 0) ?
                                                                                error.responseJSON.error.innererror.errordetails[0].message :
                                                                                error.responseJSON.error.message.value;
                                                                            var SalesOrderArr = that.getView().getModel("oDataModel").getProperty("/aSecondTableData");
                                                                            SalesOrderArr[ind1].PGIStatus = "Error";
                                                                            SalesOrderArr[ind1].Error = message1;
                                                                            that.getView().getModel("oDataModel").setProperty("/aSecondTableData", SalesOrderArr);
                                                                        }
                                                                    });
                                                                }, 3000);
                                                            }
                                                            if ((ind1 == arr1.length - 1) && (ind2 == arr2.length - 1) && (ind3 == arr3.length - 1)) {
                                                                that.getView().byId("idGenerateBatchSplitButton").setEnabled(true);
                                                                oBusy.close();
                                                            }
                                                        },
                                                        error: function (error) {
                                                            const message1 = (error.responseJSON.error.innererror.errordetails.length !== 0) ?
                                                                error.responseJSON.error.innererror.errordetails[0].message :
                                                                error.responseJSON.error.message.value;
                                                            console.log(message1);
                                                        }
                                                    });
                                                }, 2000);
                                            })
                                        }

                                    },
                                    error: () => {
                                        MessageBox.alert("Error");
                                    },
                                });
                            })
                        })
                    }
                });
            },
            onGenerateBatchSplitWithPGIPress_old5: function () {
                var that = this;
                const aCreatedDelieryData = that.getView().getModel("oDataModel").getProperty("/aSecondTableData");
                var oDataModel = new sap.ui.model.odata.v2.ODataModel("/sap/opu/odata/sap/ZDELIVERYCREATION_BIN");
                $.ajax({
                    type: "GET",
                    url: "/sap/opu/odata/sap/API_OUTBOUND_DELIVERY_SRV;v=0002/A_OutbDeliveryItem",
                    async: true,
                    contentType: "application/json",
                    dataType: 'json',
                    beforeSend: function (xhr) {
                        xhr.setRequestHeader('X-CSRF-Token', 'fetch');
                    },
                    complete: function (response) {
                        const token = response.getResponseHeader('X-CSRF-Token');
                        aCreatedDelieryData.map(function (item1, ind1, arr1) {
                            var DeliveryDocumentNumber = item1.DeliveryNumber;
                            var aCreatedDelieryItemData = item1.DeliveryItemData;
                            aCreatedDelieryItemData.map(function (item2, ind2, arr2) {
                                var DeliveryDocumentItems = item2.DeliveryDocumentItem;
                                var RequiredQuantity = parseFloat(item2.DeliveryDocumentQuantity);
                                var Material = item2.Material;
                                oDataModel.read("/Batch_Determin", {
                                    filters: [new sap.ui.model.Filter("Product", "EQ", Material)],
                                    urlParameters: { "$top": "5000" },
                                    success: function (oRespo) {
                                        var resultArray = [];
                                        if (oRespo.results.length != 0) {
                                            var aNewArr = [];
                                            oRespo.results.map(function (item) {
                                                if (item.Quantity != "" && item.Quantity != "0" && item.Quantity != "0.00") {
                                                    aNewArr.push(item);
                                                }
                                            })
                                            var accumulatedQuantity = 0;
                                            for (var i = 0; i < aNewArr.length && accumulatedQuantity < RequiredQuantity; i++) {
                                                var currentQuantity = parseFloat(aNewArr[i].Quantity);
                                                var neededQuantity = RequiredQuantity - accumulatedQuantity;
                                                if (currentQuantity >= neededQuantity) {
                                                    var partialItem = {
                                                        "Batch": aNewArr[i].Batch,
                                                        "Product": Material,
                                                        "Plant": aNewArr[i].Plant,
                                                        "MaterialBaseUnit": aNewArr[i].MaterialBaseUnit,
                                                        "Quantity": neededQuantity.toString(),
                                                    };
                                                    if (neededQuantity > 0) {
                                                        resultArray.push(partialItem);
                                                    }
                                                    accumulatedQuantity += neededQuantity;
                                                } else {
                                                    resultArray.push(aNewArr[i]);
                                                    accumulatedQuantity += currentQuantity;
                                                }
                                            }

                                            function BatchSplit(item3, ind3, arr3) {
                                                return new Promise((resolve, reject) => {
                                                    const Batch = item3.Batch;
                                                    const Delivery = DeliveryDocumentNumber;
                                                    const DeliveryDocumentItem = DeliveryDocumentItems;
                                                    const ActualDeliveryQuantity = item3.Quantity;
                                                    setTimeout(function () {
                                                        if (ind2 == arr2.length - 1) {
                                                            $.ajax({
                                                                type: "POST",
                                                                url: "/sap/opu/odata/sap/API_OUTBOUND_DELIVERY_SRV;v=0002/PostGoodsIssue?DeliveryDocument=" + "'" + DeliveryDocumentNumber + "'",
                                                                async: true,
                                                                headers: {
                                                                    "X-CSRF-TOKEN": token,
                                                                    "Accept": "application/json",
                                                                    "etag": "*",
                                                                    "If-Match": '*',
                                                                    "DataServiceVersion": "2.0",
                                                                    "Content-Type": "application/json",
                                                                    "Authorization": "Basic UFBfU01QTDAxOnFrSEZWSlplZHhQRERvfmlBdVhDVGhVTjRycFZGUkdKUFNXZWt6cGo="
                                                                },
                                                                success: function (data) {
                                                                    var SalesOrderArr = that.getView().getModel("oDataModel").getProperty("/aSecondTableData");
                                                                    SalesOrderArr[ind1].PGIStatus = "Success";
                                                                    SalesOrderArr[ind1].Error = "";
                                                                    that.getView().getModel("oDataModel").setProperty("/aSecondTableData", SalesOrderArr);
                                                                    resolve("Done");
                                                                },
                                                                error: function (error) {
                                                                    const message1 = (error.responseJSON.error.innererror.errordetails.length !== 0) ?
                                                                        error.responseJSON.error.innererror.errordetails[0].message :
                                                                        error.responseJSON.error.message.value;
                                                                    var SalesOrderArr = that.getView().getModel("oDataModel").getProperty("/aSecondTableData");
                                                                    SalesOrderArr[ind1].PGIStatus = "Error";
                                                                    SalesOrderArr[ind1].Error = message1;
                                                                    that.getView().getModel("oDataModel").setProperty("/aSecondTableData", SalesOrderArr);
                                                                    resolve();

                                                                }
                                                            });
                                                        }
                                                        else {
                                                            $.ajax({
                                                                type: "POST",
                                                                url: "/sap/opu/odata/sap/API_OUTBOUND_DELIVERY_SRV;v=0002/CreateBatchSplitItem?PickQuantityInSalesUOM=0M&Batch='" + Batch + "'&DeliveryDocument='" + Delivery + "'&DeliveryDocumentItem='" + DeliveryDocumentItem + "'&ActualDeliveryQuantity=" + ActualDeliveryQuantity + "M&DeliveryQuantityUnit='PC'",
                                                                async: true,
                                                                headers: {
                                                                    "X-CSRF-TOKEN": token,
                                                                    "Accept": "application/json",
                                                                    "etag": "*",
                                                                    "If-Match": '*',
                                                                    "DataServiceVersion": "2.0",
                                                                    "Content-Type": "application/json",
                                                                    "Authorization": "Basic UFBfU01QTDAxOnFrSEZWSlplZHhQRERvfmlBdVhDVGhVTjRycFZGUkdKUFNXZWt6cGo="
                                                                },
                                                                success: function (data) {
                                                                    resolve("Done");
                                                                },
                                                                error: function (error) {
                                                                    const message1 = (error.responseJSON.error.innererror.errordetails.length !== 0) ?
                                                                        error.responseJSON.error.innererror.errordetails[0].message :
                                                                        error.responseJSON.error.message.value;
                                                                    console.log(message1);
                                                                    resolve();
                                                                }
                                                            });
                                                        }
                                                    }, 3000);

                                                });
                                            }
                                            Promise.all(resultArray.map(BatchSplit))
                                                .then(function () {
                                                    console.log("All requests completed successfully with PGI");

                                                })
                                                .catch(function () {
                                                    console.log("Error Occur When Calling Data");
                                                })
                                        }

                                    },
                                    error: () => {
                                        MessageBox.alert("Error");
                                    },
                                });
                            })
                        })
                    }
                });
            },
            onGenerateBatchSplitWithPGIPress_old7: function () {
                var that = this;
                const aCreatedDelieryData = that.getView().getModel("oDataModel").getProperty("/aSecondTableData");
                var oDataModel = new sap.ui.model.odata.v2.ODataModel("/sap/opu/odata/sap/ZDELIVERYCREATION_BIN");
                aCreatedDelieryData.map(function (item1, ind1, arr1) {
                    var DeliveryDocumentNumber = item1.DeliveryNumber;
                    var aCreatedDelieryItemData = item1.DeliveryItemData;
                    aCreatedDelieryItemData.map(function (item2, ind2, arr2) {
                        var DeliveryDocumentItems = item2.DeliveryDocumentItem;
                        var RequiredQuantity = parseFloat(item2.DeliveryDocumentQuantity);
                        var Material = item2.Material;
                        var url = "/sap/bc/http/sap/ZSDVL01N_BATCH_SPLIT?sap-client=080" + "&DeliveryDocumentNumber=" + DeliveryDocumentNumber + "&DeliveryDocumentItems=" + DeliveryDocumentItems + "&RequiredQuantity=" + RequiredQuantity + "&Supplier=" + Material;
                        $.ajax({
                            type: "GET",
                            url: url,
                            contentType: "application/json; charset=utf-8",
                            traditional: true,
                            success: function (data) {
                                var Data = Data;
                            }.bind(this),
                            error: function (error) {
                                var Data = error;
                            }
                        });
                    })
                })
            },

            handleResponsivePopoverPress: function (oEvent) {
                var aSelectedArr = [];
                var obj = oEvent.getSource().getBindingContext('oDataModel').getObject();
                aSelectedArr.push(obj);
                this.getOwnerComponent().setModel(new sap.ui.model.json.JSONModel({ "index": 2 }), "oFirstScreenSelectedIndexDataModel");
                this.getOwnerComponent().setModel(new sap.ui.model.json.JSONModel, "oFirstScreenDataModel");
                this.getOwnerComponent().getModel("oFirstScreenDataModel").setProperty("/aFirstScreenData", aSelectedArr);
                var oButton = oEvent.getSource(),
                    oView = this.getView();
                if (!this._pPopover) {
                    this._pPopover = Fragment.load({
                        id: oView.getId(),
                        name: "ztest.view.Popover",
                        controller: this
                    }).then(function (oPopover) {
                        oView.addDependent(oPopover);
                        return oPopover;
                    });
                }
                this._pPopover.then(function (oPopover) {
                    oPopover.openBy(oButton);
                });
            },



            onCallDeliveryDocumentItem: function (oEvent) {
                // alert("Devendra Singh")
                var obj = oEvent.getSource().getBindingContext('oDataModel').getObject();
                var aSelectedArr = [];
                aSelectedArr.push(obj);
                this.getOwnerComponent().setModel(new sap.ui.model.json.JSONModel, "oFirstScreenDataModel");
                this.getOwnerComponent().getModel("oFirstScreenDataModel").setProperty("/aFirstScreenData", aSelectedArr);

                var oButton = oEvent.getSource();
                this.getView().byId("idResponsivePopover").openBy(oButton);
            },
            onCloseButtonPress: function (oEvent) {
                this.byId("idResponsivePopover").close();
            },











            onGenerateDeliveryPressBackend1: function (oEvent) {
                var that = this;
                var aLineItemData = that.getView().getModel("oDataModel").getProperty("/aTableData");
                // BusyIndicator.show();
                const aError = [];
                const aSOLDTOCODEError = [];
                const aSHIPTOCODEError = [];
                // const aTRANSPORTCODEError = [];
                const aVENDORCODEError = [];
                const aPACKERCODEError = [];
                const asticherCODEError = [];
                const aCarrierCODEError = [];
                const aSOLDTOCODEError1 = [];
                const aSHIPTOCODEError1 = [];
                // const aTRANSPORTCODEError1 = [];
                const aVENDORCODEError1 = [];
                const aPACKERCODEError1 = [];
                const asticherCODEError1 = [];
                const ahasteCODEError = [];
                const ahasteCODEError1 = [];
                const aCarrierCODEError1 = [];
                const aBrokerCodeError1 = [];
                const aBrokerCodeError = [];
                if (aLineItemData.length != 0 && Number(that.getView().byId("idNoofCopyInput").getValue()) < 51) {
                    aLineItemData.map(function (item, ind) {
                        if (item.SalesOrderItemCategory != "TAP" && ((Number(item.TotalDeliveryQuantity) > Number(item.OpenQuantity)) || (Number(item.TotalDeliveryQuantity) > Number(item.StockQuantity)))) {
                            aError.push("Error");
                            item.DeliveryQuantity_valueState = "Error";
                        } else {
                            item.DeliveryQuantity_valueState = "None";
                        }
                        if (ind == 0) {
                            aSOLDTOCODEError.push(item.SOLDTOCODE);
                            aSHIPTOCODEError.push(item.SHIPTOCODE);
                            // aTRANSPORTCODEError.push(item.TRANSPORTCODE);
                            aVENDORCODEError.push(item.VENDORCODE);
                            aPACKERCODEError.push(item.PACKERCODE);
                            asticherCODEError.push(item.sticherCODE);
                            aCarrierCODEError.push(item.CarrierCODE);
                            ahasteCODEError.push(item.hasteCODE);
                            aBrokerCodeError.push(item.BrokerCode);
                        } else {
                            if (aBrokerCodeError.includes(item.BrokerCode) == false) { aBrokerCodeError1.push("Error") }
                            if (aSOLDTOCODEError.includes(item.SOLDTOCODE) == false) { aSOLDTOCODEError1.push("Error") }
                            if (aSHIPTOCODEError.includes(item.SHIPTOCODE) == false) { aSHIPTOCODEError1.push("Error") }
                            // if (aTRANSPORTCODEError.includes(item.TRANSPORTCODE) == false) { aTRANSPORTCODEError1.push("Error") }
                            if (ahasteCODEError.includes(item.hasteCODE) == false) { ahasteCODEError1.push("Error") }
                            if (aVENDORCODEError.includes(item.VENDORCODE) == false) { aVENDORCODEError1.push("Error") }
                            if (aPACKERCODEError.includes(item.PACKERCODE) == false) { aPACKERCODEError1.push("Error") }
                            if (asticherCODEError.includes(item.sticherCODE) == false) { asticherCODEError1.push("Error") }
                            if (aCarrierCODEError.includes(item.CarrierCODE) == false) { aCarrierCODEError1.push("Error") }
                        }
                    })
                    if (aError.length != 0) {
                        BusyIndicator.hide();
                        that.getView().getModel("oDataModel").setProperty("/aTableData", aLineItemData)
                        var synth3 = window.speechSynthesis;
                        var utterThis3 = new SpeechSynthesisUtterance("Please  Check Delivery Quantity First");
                        synth3.speak(utterThis3);
                        MessageBox.error("Please  Check Delivery Quantity First");
                    }
                    else if (
                        aSOLDTOCODEError1.length != 0 ||
                        aSHIPTOCODEError1.length != 0 ||
                        // aTRANSPORTCODEError1.length != 0 ||
                        aVENDORCODEError1.length != 0 ||
                        aPACKERCODEError1.length != 0 ||
                        asticherCODEError1.length != 0 ||
                        aBrokerCodeError1.length != 0 ||
                        ahasteCODEError1.length != 0 ||
                        aCarrierCODEError1.length != 0) {
                        var aErrorText = "";
                        var aErrorText1 = "Please Select Unique";
                        if (aSOLDTOCODEError1.length != 0) {
                            aErrorText = aErrorText + "Please Select Unique Sold to Party Codes Sales Order\n"
                            aErrorText1 = aErrorText1 + "Sold to Party Code";
                        }
                        if (aBrokerCodeError1.length != 0) {
                            aErrorText = aErrorText + "Please Select Unique Broker Codes Sales Order\n"
                            aErrorText1 = aErrorText1 + "Broker Code";
                        }
                        if (ahasteCODEError1.length != 0) {
                            aErrorText = aErrorText + "Please Select Unique Haste Codes Sales Order\n"
                            aErrorText1 = aErrorText1 + "Ship to Party Code";
                        }
                        if (aSHIPTOCODEError1.length != 0) {
                            aErrorText = aErrorText + "Please Select Unique Ship to Party Codes Sales Order\n"
                            aErrorText1 = aErrorText1 + "Ship to Party Code";
                        }
                        // if (aTRANSPORTCODEError1.length != 0) {
                        //     aErrorText = aErrorText + "Please Select Unique Transporter Codes Sales Order\n"
                        //     aErrorText1 = aErrorText1 + "Transporter Code";
                        // }
                        if (aVENDORCODEError1.length != 0) {
                            aErrorText = aErrorText + "Please Select Unique Vendor Codes Sales Order\n"
                            aErrorText1 = aErrorText1 + "Vendor Code";
                        }
                        if (aPACKERCODEError1.length != 0) {
                            aErrorText = aErrorText + "Please Select Unique Parker Codes Sales Order\n"
                            aErrorText1 = aErrorText1 + "Parker Code";
                        }
                        if (asticherCODEError1.length != 0) {
                            aErrorText = aErrorText + "Please Select Unique Sticher Codes Sales Order\n"
                            aErrorText1 = aErrorText1 + "Sticher Code";
                        }
                        if (aCarrierCODEError1.length != 0) {
                            aErrorText = aErrorText + "Please Select Unique Carrier Codes Sales Order\n"
                            aErrorText1 = aErrorText1 + "Carrier Code";
                        }
                        MessageBox.error(aErrorText);
                        var synth3 = window.speechSynthesis;
                        var utterThis3 = new SpeechSynthesisUtterance(aErrorText1 + " for Sales Order");
                        synth3.speak(utterThis3);
                    }
                    else {
                        var that = this;
                        var aLineItemData = that.getView().getModel("oDataModel").getProperty("/aTableData");
                        aLineItemData.map(function (items) {
                            items.TableDeliveryQuantityFieldEditable = false;
                        })

                        that.getView().byId("idPackingTypeComboBox").setEditable(false);
                        that.getView().byId("idSalectionTypeComboBox").setEditable(true);
                        that.getView().byId("idRemark1Input").setEditable(false);
                        that.getView().byId("idRemark2Input").setEditable(false);
                        that.getView().byId("idRemark3Input").setEditable(false);
                        that.getView().byId("idTransporterCodeInput").setEditable(false);
                        that.getView().byId("idParcelCarrierCodeInput").setEditable(false);

                        that.getView().getModel("oDataModel").setProperty("/aTableData", aLineItemData);
                        var aLineItemData = that.getView().getModel("oDataModel").getProperty("/aTableData");
                        var aAllBackendDataforDelete = that.getView().getModel("oDataModel").getProperty("/aAllBackendDataforDelete");
                        const uniqueNewArr = aAllBackendDataforDelete.filter(abc =>
                            !aLineItemData.some(def =>
                                def.SalesOrder === abc.SalesOrder &&
                                def.SalesOrderItem === abc.SalesOrderItem
                            )
                        );
                        var aPayloadArr = [];
                        aAllBackendDataforDelete.map(function (abc) {
                            const abcd = aLineItemData.filter(def => def.SalesOrder == abc.SalesOrde && def.SalesOrderItem == abc.SalesOrderItem);
                            var ghi = abc;
                            if (abcd.length != 0) {
                                ghi.DeliveryQuantity == abcd[0].DeliveryQuantity;
                            } else {
                                ghi.DeliveryQuantity == "";
                            }
                            aPayloadArr.push(ghi);
                        })
                        var NumberOfCopy = Number(this.getView().byId("idNoofCopyInput").getValue());
                        var oBusy = new sap.m.BusyDialog({
                            text: "Scheduling..."
                        });
                        // oBusy.open();
                        // that.getView().byId("")
                        const aRespoArr = [];
                        for (var D = 1; D <= NumberOfCopy; D++) {
                            aRespoArr.push({
                                "SerialNumber": (D * 10).toString(),
                                "DeliveryNumber": "",
                                "Error": "",
                                "DeliveryNumberActive": false,
                                "PGIStatus": "",
                                "BatchStatus": "",
                                "DeliveryItemData": [],
                            })
                        }
                        that.getView().byId("idGenerateDeliveryIconTabFilter").setEnabled(false)
                        that.getView().getModel("oDataModel").setProperty("/aSecondTableData", aRespoArr);
                        var url = "/sap/opu/odata/sap/API_OUTBOUND_DELIVERY_SRV;v=0002/A_OutbDeliveryHeader";
                        $.ajax({
                            type: "GET",
                            url: url,
                            async: true,
                            contentType: "application/json",
                            dataType: 'json',
                            beforeSend: function (xhr) {
                                xhr.setRequestHeader('X-CSRF-Token', 'fetch');
                            },
                            complete: function (response) {
                                const token = response.getResponseHeader('X-CSRF-Token');
                                const aDeliveryDeletionArr = [];
                                var aCreatedDeliveryArr = that.getView().getModel("oDataModel").getProperty("/aSecondTableData");
                                aCreatedDeliveryArr.map(function (item) {
                                    aLineItemData.map(function (items) {
                                        const newObj = { ...items };
                                        newObj["CreatedDeliveryNumber"] = item.DeliveryNumber;
                                        aDeliveryDeletionArr.push(newObj)
                                    })
                                })
                                aRespoArr.map(function (items, ind, arr) {
                                    const newObj = {
                                        "YY1_Remark1_DLH": that.getView().byId("idRemark1Input").getValue(),
                                        "YY1_Remark2_DLH": that.getView().byId("idRemark2Input").getValue(),
                                        "YY1_Remark3_DLH": that.getView().byId("idRemark3Input").getValue(),
                                        "YY1_PackingType_DLH": that.getView().byId("idPackingTypeComboBox").getValue(),
                                        "YY1_SalesTransporter_DLH": that.getView().byId("idTransporterCodeInput").getValue(),
                                        "YY1_ParcelCarrier_DLH": that.getView().byId("idParcelCarrierCodeInput").getValue(),
                                        "to_DeliveryDocumentItem": {
                                            "results": []
                                        }
                                    };
                                    aPayloadArr.map(function (item) {
                                        newObj.to_DeliveryDocumentItem.results.push(
                                            {
                                                "ReferenceSDDocument": item.SalesOrderNo,
                                                "ReferenceSDDocumentItem": item.SalesOrderItem,
                                                "ActualDeliveryQuantity": item.DeliveryQuantity,
                                                "DeliveryQuantityUnit": item.UnitOfMeasure_E,
                                            }
                                        )
                                    })
                                    $.ajax({
                                        type: "POST",
                                        url: url,
                                        async: true,
                                        headers: {
                                            "X-CSRF-TOKEN": token,
                                            "Accept": "application/json",
                                            "Content-Type": "application/json",
                                            "Authorization": "Basic UFBfU01QTDAxOnFrSEZWSlplZHhQRERvfmlBdVhDVGhVTjRycFZGUkdKUFNXZWt6cGo="
                                        },
                                        data: JSON.stringify(newObj),
                                        success: function (data) {
                                            oBusy.close();
                                            const SalesOrderArr = that.getView().getModel("oDataModel").getProperty("/aSecondTableData");
                                            SalesOrderArr[ind].DeliveryNumber = data.d.DeliveryDocument;
                                            SalesOrderArr[ind].Error = "";
                                            that.getView().getModel("oDataModel").setProperty("/aSecondTableData", SalesOrderArr);
                                            $.ajax({
                                                type: "POST",
                                                url: "/sap/bc/http/sap/ZDELIVERY_CREATION_HTTP?sap-client=080",
                                                data: JSON.stringify({
                                                    aLineItem: that.getView().getModel("oDataModel").getProperty("/aSecondTableData"),
                                                    aLineItemData: that.getView().getModel("oDataModel").getProperty("/aTableData"),
                                                    aAllBackendDataforDelete: that.getView().getModel("oDataModel").getProperty("/aAllBackendDataforDelete"),
                                                    aDeliveryDeletionArr: aDeliveryDeletionArr,
                                                    DeliveryDocument: data.d.DeliveryDocument,
                                                    APItoken: token,
                                                }),
                                                contentType: "application/json; charset=utf-8",
                                                traditional: true,
                                                success: function (oresponse) {
                                                    that.getView().byId("idGenerateDeliveryIconTabFilter").setEnabled(true);
                                                    oBusy.close();
                                                    const SalesOrderArr = that.getView().getModel("oDataModel").getProperty("/aSecondTableData");
                                                    SalesOrderArr[ind].PGIStatus = "Success";
                                                    SalesOrderArr[ind].Error = "";
                                                    that.getView().getModel("oDataModel").setProperty("/aSecondTableData", SalesOrderArr);
                                                },
                                                error: function (error) {
                                                    oBusy.close();
                                                    console.log(error);
                                                }
                                            });
                                        },
                                        error: function (error) {
                                            that.getView().byId("idGenerateDeliveryIconTabFilter").setEnabled(true);
                                            const message1 = (error.responseJSON.error.innererror.errordetails.length !== 0)
                                                ? error.responseJSON.error.innererror.errordetails[0].message
                                                : error.responseJSON.error.message.value;
                                            var SalesOrderArr = that.getView().getModel("oDataModel").getProperty("/aSecondTableData");
                                            SalesOrderArr[ind].Error = message1;
                                            that.getView().getModel("oDataModel").setProperty("/aSecondTableData", SalesOrderArr);
                                            oBusy.close();
                                        }
                                    });
                                })
                            }
                        });
                    }
                }
            },



            onGenerateDeliveryPressBackend: function (oEvent) {
                var that = this;
                var aLineItemData = that.getView().getModel("oDataModel").getProperty("/aTableData");
                // BusyIndicator.show();
                const aError = [];
                const aSOLDTOCODEError = [];
                const aSHIPTOCODEError = [];
                // const aTRANSPORTCODEError = [];
                const aVENDORCODEError = [];
                const aPACKERCODEError = [];
                const asticherCODEError = [];
                const aCarrierCODEError = [];
                const aSOLDTOCODEError1 = [];
                const aSHIPTOCODEError1 = [];
                // const aTRANSPORTCODEError1 = [];
                const aVENDORCODEError1 = [];
                const aPACKERCODEError1 = [];
                const asticherCODEError1 = [];
                const ahasteCODEError = [];
                const ahasteCODEError1 = [];
                const aCarrierCODEError1 = [];
                const aBrokerCodeError1 = [];
                const aBrokerCodeError = [];
                if (aLineItemData.length != 0 && Number(that.getView().byId("idNoofCopyInput").getValue()) < 51) {
                    aLineItemData.map(function (item, ind) {
                        if (item.SalesOrderItemCategory != "TAP" && ((Number(item.TotalDeliveryQuantity) > Number(item.OpenQuantity)) || (Number(item.TotalDeliveryQuantity) > Number(item.StockQuantity)))) {
                            aError.push("Error");
                            item.DeliveryQuantity_valueState = "Error";
                        } else {
                            item.DeliveryQuantity_valueState = "None";
                        }
                        if (ind == 0) {
                            aSOLDTOCODEError.push(item.SOLDTOCODE);
                            aSHIPTOCODEError.push(item.SHIPTOCODE);
                            // aTRANSPORTCODEError.push(item.TRANSPORTCODE);
                            aVENDORCODEError.push(item.VENDORCODE);
                            aPACKERCODEError.push(item.PACKERCODE);
                            asticherCODEError.push(item.sticherCODE);
                            aCarrierCODEError.push(item.CarrierCODE);
                            ahasteCODEError.push(item.hasteCODE);
                            aBrokerCodeError.push(item.BrokerCode);
                        } else {
                            if (aBrokerCodeError.includes(item.BrokerCode) == false) { aBrokerCodeError1.push("Error") }
                            if (aSOLDTOCODEError.includes(item.SOLDTOCODE) == false) { aSOLDTOCODEError1.push("Error") }
                            if (aSHIPTOCODEError.includes(item.SHIPTOCODE) == false) { aSHIPTOCODEError1.push("Error") }
                            // if (aTRANSPORTCODEError.includes(item.TRANSPORTCODE) == false) { aTRANSPORTCODEError1.push("Error") }
                            if (ahasteCODEError.includes(item.hasteCODE) == false) { ahasteCODEError1.push("Error") }
                            if (aVENDORCODEError.includes(item.VENDORCODE) == false) { aVENDORCODEError1.push("Error") }
                            if (aPACKERCODEError.includes(item.PACKERCODE) == false) { aPACKERCODEError1.push("Error") }
                            if (asticherCODEError.includes(item.sticherCODE) == false) { asticherCODEError1.push("Error") }
                            if (aCarrierCODEError.includes(item.CarrierCODE) == false) { aCarrierCODEError1.push("Error") }
                        }
                    })
                    if (aError.length != 0) {
                        BusyIndicator.hide();
                        that.getView().getModel("oDataModel").setProperty("/aTableData", aLineItemData)
                        var synth3 = window.speechSynthesis;
                        var utterThis3 = new SpeechSynthesisUtterance("Please  Check Delivery Quantity First");
                        synth3.speak(utterThis3);
                        MessageBox.error("Please  Check Delivery Quantity First");
                    }
                    else if (
                        aSOLDTOCODEError1.length != 0 ||
                        aSHIPTOCODEError1.length != 0 ||
                        // aTRANSPORTCODEError1.length != 0 ||
                        aVENDORCODEError1.length != 0 ||
                        aPACKERCODEError1.length != 0 ||
                        asticherCODEError1.length != 0 ||
                        aBrokerCodeError1.length != 0 ||
                        ahasteCODEError1.length != 0 ||
                        aCarrierCODEError1.length != 0) {
                        var aErrorText = "";
                        var aErrorText1 = "Please Select Unique";
                        if (aSOLDTOCODEError1.length != 0) {
                            aErrorText = aErrorText + "Please Select Unique Sold to Party Codes Sales Order\n"
                            aErrorText1 = aErrorText1 + "Sold to Party Code";
                        }
                        if (aBrokerCodeError1.length != 0) {
                            aErrorText = aErrorText + "Please Select Unique Broker Codes Sales Order\n"
                            aErrorText1 = aErrorText1 + "Broker Code";
                        }
                        if (ahasteCODEError1.length != 0) {
                            aErrorText = aErrorText + "Please Select Unique Haste Codes Sales Order\n"
                            aErrorText1 = aErrorText1 + "Ship to Party Code";
                        }
                        if (aSHIPTOCODEError1.length != 0) {
                            aErrorText = aErrorText + "Please Select Unique Ship to Party Codes Sales Order\n"
                            aErrorText1 = aErrorText1 + "Ship to Party Code";
                        }
                        // if (aTRANSPORTCODEError1.length != 0) {
                        //     aErrorText = aErrorText + "Please Select Unique Transporter Codes Sales Order\n"
                        //     aErrorText1 = aErrorText1 + "Transporter Code";
                        // }
                        if (aVENDORCODEError1.length != 0) {
                            aErrorText = aErrorText + "Please Select Unique Vendor Codes Sales Order\n"
                            aErrorText1 = aErrorText1 + "Vendor Code";
                        }
                        if (aPACKERCODEError1.length != 0) {
                            aErrorText = aErrorText + "Please Select Unique Parker Codes Sales Order\n"
                            aErrorText1 = aErrorText1 + "Parker Code";
                        }
                        if (asticherCODEError1.length != 0) {
                            aErrorText = aErrorText + "Please Select Unique Sticher Codes Sales Order\n"
                            aErrorText1 = aErrorText1 + "Sticher Code";
                        }
                        if (aCarrierCODEError1.length != 0) {
                            aErrorText = aErrorText + "Please Select Unique Carrier Codes Sales Order\n"
                            aErrorText1 = aErrorText1 + "Carrier Code";
                        }
                        MessageBox.error(aErrorText);
                        var synth3 = window.speechSynthesis;
                        var utterThis3 = new SpeechSynthesisUtterance(aErrorText1 + " for Sales Order");
                        synth3.speak(utterThis3);
                    }
                    else {
                        var that = this;
                        var aLineItemData = that.getView().getModel("oDataModel").getProperty("/aTableData");
                        aLineItemData.map(function (items) {
                            items.TableDeliveryQuantityFieldEditable = false;
                        })

                        that.getView().byId("idPackingTypeComboBox").setEditable(false);
                        that.getView().byId("idSalectionTypeComboBox").setEditable(true);
                        that.getView().byId("idRemark1Input").setEditable(false);
                        that.getView().byId("idRemark2Input").setEditable(false);
                        that.getView().byId("idRemark3Input").setEditable(false);
                        that.getView().byId("idTransporterCodeInput").setEditable(false);
                        that.getView().byId("idParcelCarrierCodeInput").setEditable(false);

                        that.getView().getModel("oDataModel").setProperty("/aTableData", aLineItemData);
                        var aLineItemData = that.getView().getModel("oDataModel").getProperty("/aTableData");
                        var aAllBackendDataforDelete = that.getView().getModel("oDataModel").getProperty("/aAllBackendDataforDelete");
                        const uniqueNewArr = aAllBackendDataforDelete.filter(abc =>
                            !aLineItemData.some(def =>
                                def.SalesOrder === abc.SalesOrder &&
                                def.SalesOrderItem === abc.SalesOrderItem
                            )
                        );
                        var aPayloadArr = [];
                        aAllBackendDataforDelete.map(function (abc) {
                            const abcd = aLineItemData.filter(def => def.SalesOrder == abc.SalesOrde && def.SalesOrderItem == abc.SalesOrderItem);
                            var ghi = abc;
                            if (abcd.length != 0) {
                                ghi.DeliveryQuantity == abcd[0].DeliveryQuantity;
                            } else {
                                ghi.DeliveryQuantity == "";
                            }
                            aPayloadArr.push(ghi);
                        })
                        var NumberOfCopy = Number(this.getView().byId("idNoofCopyInput").getValue());
                        var oBusy = new sap.m.BusyDialog({
                            text: "Scheduling..."
                        });
                        oBusy.open();
                        // that.getView().byId("")
                        const aRespoArr = [];
                        for (var D = 1; D <= NumberOfCopy; D++) {
                            aRespoArr.push({
                                "SerialNumber": (D * 10).toString(),
                                "DeliveryNumber": "",
                                "Error": "",
                                "DeliveryNumberActive": false,
                                "PGIStatus": "",
                                "BatchStatus": "",
                                "DeliveryItemData": [],
                            })
                        }
                        that.getView().getModel("oDataModel").setProperty("/aSecondTableData", aRespoArr);
                        var url = "/sap/opu/odata/sap/API_OUTBOUND_DELIVERY_SRV;v=0002/A_OutbDeliveryHeader";
                        that.getView().byId("idGenerateDeliveryIconTabFilter").setEnabled(false);
                        $.ajax({
                            type: "GET",
                            url: url,
                            async: true,
                            contentType: "application/json",
                            dataType: 'json',
                            beforeSend: function (xhr) {
                                xhr.setRequestHeader('X-CSRF-Token', 'fetch');
                            },
                            complete: function (response) {
                                const token = response.getResponseHeader('X-CSRF-Token');
                                async function processDeliveryData(aRespoArr, url, that) {
                                    const aDeliveryDeletionArr = [];
                                    var aCreatedDeliveryArr = that.getView().getModel("oDataModel").getProperty("/aSecondTableData");
                                    aCreatedDeliveryArr.map(function (item) {
                                        aLineItemData.map(function (items) {
                                            const newObj = { ...items };
                                            newObj["CreatedDeliveryNumber"] = item.DeliveryNumber;
                                            aDeliveryDeletionArr.push(newObj)
                                        })
                                    })
                                    const promises = [];
                                    for (let index = 0; index < aRespoArr.length; index++) {
                                        const newObj = {
                                            "YY1_Remark1_DLH": that.getView().byId("idRemark1Input").getValue(),
                                            "YY1_Remark2_DLH": that.getView().byId("idRemark2Input").getValue(),
                                            "YY1_Remark3_DLH": that.getView().byId("idRemark3Input").getValue(),
                                            "YY1_PackingType_DLH": that.getView().byId("idPackingTypeComboBox").getValue(),
                                            "YY1_SalesTransporter_DLH": that.getView().byId("idTransporterCodeInput").getValue(),
                                            "YY1_ParcelCarrier_DLH": that.getView().byId("idParcelCarrierCodeInput").getValue(),
                                            "YY1_StorageLocati01_DLH": that.getView().byId("idStorageLocationComboBox").getValue(),
                                            "to_DeliveryDocumentItem": {
                                                "results": []
                                            }
                                        };
                                        aPayloadArr.map(function (item) {
                                            newObj.to_DeliveryDocumentItem.results.push(
                                                {
                                                    "ReferenceSDDocument": item.SalesOrderNo,
                                                    "ReferenceSDDocumentItem": item.SalesOrderItem,
                                                    "ActualDeliveryQuantity": item.DeliveryQuantity,
                                                    "DeliveryQuantityUnit": item.UnitOfMeasure_E,
                                                    // "StorageLocation": that.getView().byId("idStorageLocationComboBox").getValue(),
                                                }
                                            )
                                        })
                                        const promise = new Promise((resolve, reject) => {
                                            $.ajax({
                                                type: "POST",
                                                url: url,
                                                async: true,
                                                headers: {
                                                    "X-CSRF-TOKEN": token,
                                                    "Accept": "application/json",
                                                    "Content-Type": "application/json",
                                                    "Authorization": "Basic UFBfU01QTDAxOnFrSEZWSlplZHhQRERvfmlBdVhDVGhVTjRycFZGUkdKUFNXZWt6cGo="
                                                },
                                                data: JSON.stringify(newObj),
                                                success: function (data) {
                                                    oBusy.close();
                                                    const SalesOrderArr = that.getView().getModel("oDataModel").getProperty("/aSecondTableData");
                                                    SalesOrderArr[index].DeliveryNumber = data.d.DeliveryDocument;
                                                    that.getView().getModel("oDataModel").setProperty("/aSecondTableData", SalesOrderArr);
                                                    // resolve("Success");
                                                    $.ajax({
                                                        type: "POST",
                                                        url: "/sap/bc/http/sap/ZDELIVERY_CREATION_HTTP?sap-client=080",
                                                        data: JSON.stringify({
                                                            aLineItem: that.getView().getModel("oDataModel").getProperty("/aSecondTableData"),
                                                            aLineItemData: that.getView().getModel("oDataModel").getProperty("/aTableData"),
                                                            aAllBackendDataforDelete: that.getView().getModel("oDataModel").getProperty("/aAllBackendDataforDelete"),
                                                            aDeliveryDeletionArr: aDeliveryDeletionArr,
                                                            DeliveryNumber: data.d.DeliveryDocument,
                                                            APItoken: token,
                                                        }),
                                                        contentType: "application/json; charset=utf-8",
                                                        traditional: true,
                                                        success: function (oresponse) {
                                                            if (oresponse.includes('Error') == true) {
                                                                SalesOrderArr[index].PGIStatus = "Error";
                                                                SalesOrderArr[index].Error = "Error Occur...........";
                                                                that.getView().getModel("oDataModel").setProperty("/aSecondTableData", SalesOrderArr);
                                                            }
                                                            if (oresponse.includes('Success') == true) {
                                                                SalesOrderArr[index].PGIStatus = "Success";
                                                                SalesOrderArr[index].Error = "";
                                                                that.getView().getModel("oDataModel").setProperty("/aSecondTableData", SalesOrderArr);
                                                            }
                                                            resolve("Success");
                                                        },
                                                        error: function (error) {
                                                            console.log(error)
                                                        }
                                                    });
                                                },
                                                error: function (error) {
                                                    oBusy.close();
                                                    const message1 = (error.responseJSON.error.innererror.errordetails.length !== 0)
                                                        ? error.responseJSON.error.innererror.errordetails[0].message
                                                        : error.responseJSON.error.message.value;
                                                    var SalesOrderArr = that.getView().getModel("oDataModel").getProperty("/aSecondTableData");
                                                    SalesOrderArr[index].Error = message1;
                                                    that.getView().getModel("oDataModel").setProperty("/aSecondTableData", SalesOrderArr);
                                                    resolve("Error");
                                                }
                                            });
                                        });
                                        promises.push(promise);
                                        await promise;
                                    }
                                    const results = await Promise.all(promises);
                                    const aTextArr = [];
                                    aTextArr.push(...results);
                                    that.getView().byId("idGenerateDeliveryIconTabFilter").setEnabled(true);
                                }
                                processDeliveryData(aRespoArr, url, that).catch((error) => {
                                    console.error(error);
                                });
                            }
                        });
                    }
                }
            },

        });
    });
