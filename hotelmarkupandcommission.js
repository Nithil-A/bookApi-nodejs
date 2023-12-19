'use strict';

var markupandcommission = {

    findAgentMarkupAndCommission: function (clientid, RequestParameters, SupplierCost, DBMarkupCommissionData) {

        let CheckInDate = new Date(RequestParameters.CheckInDate);
        let CheckOutDate = new Date(RequestParameters.CheckOutDate);
        let NumberOfadult = parseInt(RequestParameters.NumberOfadult);
        let NumberOfchild = parseInt(RequestParameters.NumberOfchild);
        let NumberOfinfant = parseInt(RequestParameters.NumberOfinfant);

        var Difference_In_Time = CheckOutDate.getTime() - CheckInDate.getTime();
        var NumberOfNights = Difference_In_Time / (1000 * 3600 * 24);
        let NumberOfTravellers = NumberOfadult + NumberOfchild + NumberOfinfant;

        let SupplierConvertedCost = 0;
        let iscommissionable = false;
        // Database parameters

        // Take AgentMarkup from database using agentid
        var AgentMarkupdata = DBMarkupCommissionData.AgentMarkupdata;

        if (AgentMarkupdata.length === 0) {
            return ({
                SupplierCost: SupplierCost,
                currencryconversationrate: 1,
                SupplierConvertedCost: SupplierCost,
                CompanyMarkup: 0,
                TotalSupplierCostAfterCompanyMarkup: SupplierCost,
                AgentMarkup: 0,
                TotalSupplierCostAfterAgentMarkup: SupplierCost,
                AgentCommission: 0,
                TotalSupplierCostAfterAgentCommission: SupplierCost
            });
        }



        var AgentCommissiondata = DBMarkupCommissionData.AgentCommissiondata;
        var Companydata = DBMarkupCommissionData.Companydata;

        let Agentdata = [];
        Agentdata.push(...AgentMarkupdata, ...AgentCommissiondata)

        // Taken currencryconversationrate
        let AgentsWiseData = [
            {
                agentid: "21",
                username: "CMAGT",
                markupcategory: Companydata
            },
            {
                agentid: "",
                username: "",
                markupcategory: Agentdata
            }
        ]

        let CompanyAgentWiseData = AgentsWiseData.filter(item => item.username === "CMAGT");
        let AgentWiseData = AgentsWiseData.filter(item => item.username !== "CMAGT");

        let markupcategoryidwiseagent = AgentWiseData[0].markupcategory.filter(item => item.markupcategoryid === "1");

        let markupconfigurationcalculationmethod = markupcategoryidwiseagent[0].markupconfigurationcalculationmethod;



        // Find company Markup
        let SupplierCostAfterCompanyMarkup = 0;
        let CompanyMarkup = 0;
        let flagignorecompanymarkup = markupcategoryidwiseagent[0].flagignorecompanymarkup;


        let markupcategoryidwisecompanyagent = CompanyAgentWiseData[0].markupcategory.filter(item => item.markupcategoryid === "1");

        let PriceBandCriteria = markupcategoryidwiseagent[0].agentname;
        let AgentCurrencyCode = markupcategoryidwiseagent[0].agentcurrancycode;
        let currencryconversationrate = markupcategoryidwiseagent[0].currancyconvertedfector;
        let flagsharemarkupascommission = markupcategoryidwiseagent[0].flagsharemarkupascommission;

        SupplierConvertedCost = parseFloat(SupplierCost) * parseFloat(currencryconversationrate);

        let companymarkupconfigurationcalculationmethod = markupcategoryidwisecompanyagent[0].markupconfigurationcalculationmethod;

        if (companymarkupconfigurationcalculationmethod === "UPB" || companymarkupconfigurationcalculationmethod === "UPN") {
            if (companymarkupconfigurationcalculationmethod === "UPB") {    // Convert Per Unit Per Booking wise price
                var UPBSupplierConvertedCost = SupplierConvertedCost;
            } else if (companymarkupconfigurationcalculationmethod === "UPN") {   // Convert Per Unit Per Night wise price
                var UPBSupplierConvertedCost = SupplierConvertedCost / NumberOfNights;
            }

            if (markupcategoryidwisecompanyagent[0].valuetype.trim() === "F") {  // Find Fix Markup

                let findfixmarkup = this.findfixmarkup(markupcategoryidwisecompanyagent, RequestParameters);
                CompanyMarkup = findfixmarkup;

            } else if (markupcategoryidwisecompanyagent[0].valuetype.trim() === "P") {  // Find Percentage Markup

                let findpercentagemarkup = this.findpercentagemarkup(markupcategoryidwisecompanyagent, RequestParameters, UPBSupplierConvertedCost);
                CompanyMarkup = findpercentagemarkup;

            } else {
                return ({ "Error": "valuetype is not valid. valuetype must be 'P' or 'F'." });
            }
            if (flagignorecompanymarkup === false) {   // If flagignorecompanymarkup = false then and only then add company markup
                var UPBSupplierCostAfterCompanyMarkup = UPBSupplierConvertedCost + CompanyMarkup;
            } else {
                var UPBSupplierCostAfterCompanyMarkup = UPBSupplierConvertedCost;
            }

            if (companymarkupconfigurationcalculationmethod === "UPB") {
                SupplierCostAfterCompanyMarkup = UPBSupplierCostAfterCompanyMarkup;
            } else if (companymarkupconfigurationcalculationmethod === "UPN") {
                SupplierCostAfterCompanyMarkup = UPBSupplierCostAfterCompanyMarkup * NumberOfNights;
            }
            var TotalSupplierCostAfterCompanyMarkup = SupplierCostAfterCompanyMarkup;

            // console.log(UPBSupplierConvertedCost, "UPBSupplierConvertedCost");
            // console.log(UPBSupplierCostAfterCompanyMarkup, "UPBSupplierCostAfterCompanyMarkup");
            // console.log(SupplierCostAfterCompanyMarkup, "SupplierCostAfterCompanyMarkup");
        } else if (companymarkupconfigurationcalculationmethod === "PPB" || companymarkupconfigurationcalculationmethod === "PPN") {

            if (companymarkupconfigurationcalculationmethod === "PPB") {    // Convert Per Person Per Booking wise price
                var perpersonwisevalu1 = SupplierConvertedCost / NumberOfTravellers;

            } else if (companymarkupconfigurationcalculationmethod === "PPN") {   // Convert Per Person Per Night wise price
                var perpersonwisevalu1 = SupplierConvertedCost / NumberOfTravellers / NumberOfNights;
            }

            let adultvalue1 = 0;
            let childvalue1 = 0;
            let infantvalue1 = 0;
            if (NumberOfadult > 0) {
                adultvalue1 = perpersonwisevalu1;
            }
            if (NumberOfchild > 0) {
                childvalue1 = perpersonwisevalu1;
            }
            if (NumberOfinfant > 0) {
                infantvalue1 = perpersonwisevalu1;
            }

            var PPBSupplierConvertedCost = {
                adultvalue: adultvalue1,
                childvalue: childvalue1,
                infantvalue: infantvalue1
            };
            if (markupcategoryidwisecompanyagent[0].valuetype.trim() === "F") {   // Find Fix Markup

                let findpaxwisefixmarkup = this.findpaxwisefixmarkup(markupcategoryidwisecompanyagent, RequestParameters);
                CompanyMarkup = findpaxwisefixmarkup;

            } else if (markupcategoryidwisecompanyagent[0].valuetype.trim() === "P") {  // Find Percentage Markup

                let findpaxwisepercentagemarkup = this.findpaxwisepercentagemarkup(markupcategoryidwisecompanyagent, RequestParameters, PPBSupplierConvertedCost);
                CompanyMarkup = findpaxwisepercentagemarkup;

            }
            if (flagignorecompanymarkup === false) {    // If flagignorecompanymarkup = false then and only then add company markup
                let adultvalue = 0;
                let childvalue = 0;
                let infantvalue = 0;
                if (NumberOfadult > 0) {
                    adultvalue = PPBSupplierConvertedCost.adultvalue + CompanyMarkup.adultvalue;
                }
                if (NumberOfchild > 0) {
                    childvalue = PPBSupplierConvertedCost.childvalue + CompanyMarkup.childvalue;
                }
                if (NumberOfinfant > 0) {
                    infantvalue = PPBSupplierConvertedCost.infantvalue + CompanyMarkup.infantvalue;
                }

                var PPBSupplierCostAfterCompanyMarkup = {
                    adultvalue: adultvalue,
                    childvalue: childvalue,
                    infantvalue: infantvalue,
                    total: adultvalue + childvalue + infantvalue
                };
            } else {
                var PPBSupplierCostAfterCompanyMarkup = PPBSupplierConvertedCost;
            }

            let adultvalue2 = PPBSupplierCostAfterCompanyMarkup.adultvalue * NumberOfadult;
            let childvalue2 = PPBSupplierCostAfterCompanyMarkup.childvalue * NumberOfchild;
            let infantvalue2 = PPBSupplierCostAfterCompanyMarkup.infantvalue * NumberOfinfant;
            if (companymarkupconfigurationcalculationmethod === "PPB") {
                SupplierCostAfterCompanyMarkup = {
                    adultvalue: adultvalue2,
                    childvalue: childvalue2,
                    infantvalue: infantvalue2
                }

            } else if (companymarkupconfigurationcalculationmethod === "PPN") {
                SupplierCostAfterCompanyMarkup = {
                    adultvalue: adultvalue2 * NumberOfNights,
                    childvalue: childvalue2 * NumberOfNights,
                    infantvalue: infantvalue2 * NumberOfNights
                }

            }
            var TotalSupplierCostAfterCompanyMarkup = SupplierCostAfterCompanyMarkup.adultvalue + SupplierCostAfterCompanyMarkup.childvalue + SupplierCostAfterCompanyMarkup.infantvalue;

            // console.log(PPBSupplierConvertedCost, "PPBSupplierConvertedCost");
            // console.log(PPBSupplierCostAfterCompanyMarkup, "PPBSupplierCostAfterCompanyMarkup");
            // console.log(SupplierCostAfterCompanyMarkup, "SupplierCostAfterCompanyMarkup");
        }

        // End Comapny Markup

        // Find Agent Markup
        let SupplierCostAfterAgentMarkup = 0;
        let AgentMarkup = 0;

        if (markupconfigurationcalculationmethod === "UPB" || markupconfigurationcalculationmethod === "UPN") {

            // This case is for agent markup calculationmethod Unit wise
            // Here, Below if company markup calculationmethod is Unit wise then use SupplierCostAfterCompanyMarkup as it is. If company markup calculationmethod is person wise then combine adult, child and infant cost.

            if (markupconfigurationcalculationmethod === "UPB") {
                if (companymarkupconfigurationcalculationmethod === "UPB" || companymarkupconfigurationcalculationmethod === "UPN") {
                    var UPBagentSupplierCostAfterCompanyMarkup = SupplierCostAfterCompanyMarkup;
                } else {
                    var UPBagentSupplierCostAfterCompanyMarkup = SupplierCostAfterCompanyMarkup.adultvalue + SupplierCostAfterCompanyMarkup.childvalue + SupplierCostAfterCompanyMarkup.infantvalue;
                }
            } else if (markupconfigurationcalculationmethod === "UPN") {
                if (companymarkupconfigurationcalculationmethod === "UPB" || companymarkupconfigurationcalculationmethod === "UPN") {
                    var UPBagentSupplierCostAfterCompanyMarkup = SupplierCostAfterCompanyMarkup / NumberOfNights;
                } else {
                    var UPBagentSupplierCostAfterCompanyMarkup = (SupplierCostAfterCompanyMarkup.adultvalue + SupplierCostAfterCompanyMarkup.childvalue + SupplierCostAfterCompanyMarkup.infantvalue) / NumberOfNights;
                }
            }


            if (markupcategoryidwiseagent[0].valuetype.trim() === "F") {

                let findfixmarkup = this.findfixmarkup(markupcategoryidwiseagent, RequestParameters);
                AgentMarkup = findfixmarkup;

            } else if (markupcategoryidwiseagent[0].valuetype.trim() === "P") {

                let findpercentagemarkup = this.findpercentagemarkup(markupcategoryidwiseagent, RequestParameters, UPBagentSupplierCostAfterCompanyMarkup);
                AgentMarkup = findpercentagemarkup;

            }

            var UPBSupplierCostAfterAgentMarkup = UPBagentSupplierCostAfterCompanyMarkup + AgentMarkup;

            if (markupconfigurationcalculationmethod === "UPB") {
                SupplierCostAfterAgentMarkup = UPBSupplierCostAfterAgentMarkup;
            } else if (markupconfigurationcalculationmethod === "UPN") {
                SupplierCostAfterAgentMarkup = UPBSupplierCostAfterAgentMarkup * NumberOfNights;
            }
            var TotalSupplierCostAfterAgentMarkup = SupplierCostAfterAgentMarkup;

            // console.log(UPBagentSupplierCostAfterCompanyMarkup, "UPBagentSupplierCostAfterCompanyMarkup");
            // console.log(UPBSupplierCostAfterAgentMarkup, "UPBSupplierCostAfterAgentMarkup");
            // console.log(SupplierCostAfterAgentMarkup, "SupplierCostAfterAgentMarkup");
        } else if (markupconfigurationcalculationmethod === "PPB" || markupconfigurationcalculationmethod === "PPN") {

            // This case is for agent markup calculationmethod Person wise
            // Here, Below if company markup calculationmethod is Person wise then divide SupplierCostAfterCompanyMarkup peson wise. If company markup calculationmethod is person wise then combine divide Total number of traveller wise.

            let adultvalue1 = 0;
            let childvalue1 = 0;
            let infantvalue1 = 0;

            if (markupconfigurationcalculationmethod === "PPB") {
                if (companymarkupconfigurationcalculationmethod === "PPB" || companymarkupconfigurationcalculationmethod === "PPN") {
                    if (NumberOfadult > 0) {
                        adultvalue1 = SupplierCostAfterCompanyMarkup.adultvalue / NumberOfadult;
                    }
                    if (NumberOfchild > 0) {
                        childvalue1 = SupplierCostAfterCompanyMarkup.childvalue / NumberOfchild;
                    }
                    if (NumberOfinfant > 0) {
                        infantvalue1 = SupplierCostAfterCompanyMarkup.infantvalue / NumberOfinfant;
                    }

                } else {

                    if (NumberOfadult > 0) {
                        adultvalue1 = SupplierCostAfterCompanyMarkup / NumberOfTravellers;
                    }
                    if (NumberOfchild > 0) {
                        childvalue1 = SupplierCostAfterCompanyMarkup / NumberOfTravellers;
                    }
                    if (NumberOfinfant > 0) {
                        infantvalue1 = SupplierCostAfterCompanyMarkup / NumberOfTravellers;
                    }

                }

            } else if (markupconfigurationcalculationmethod === "PPN") {
                if (companymarkupconfigurationcalculationmethod === "PPB" || companymarkupconfigurationcalculationmethod === "PPN") {

                    if (NumberOfadult > 0) {
                        adultvalue1 = SupplierCostAfterCompanyMarkup.adultvalue / NumberOfadult / NumberOfNights;
                    }
                    if (NumberOfchild > 0) {
                        childvalue1 = SupplierCostAfterCompanyMarkup.childvalue / NumberOfchild / NumberOfNights;
                    }
                    if (NumberOfinfant > 0) {
                        infantvalue1 = SupplierCostAfterCompanyMarkup.infantvalue / NumberOfinfant / NumberOfNights;
                    }

                } else {

                    if (NumberOfadult > 0) {
                        adultvalue1 = SupplierCostAfterCompanyMarkup / NumberOfTravellers / NumberOfNights;
                    }
                    if (NumberOfchild > 0) {
                        childvalue1 = SupplierCostAfterCompanyMarkup / NumberOfTravellers / NumberOfNights;
                    }
                    if (NumberOfinfant > 0) {
                        infantvalue1 = SupplierCostAfterCompanyMarkup / NumberOfTravellers / NumberOfNights;
                    }

                }
            }

            let PPBagentSupplierCostAfterCompanyMarkup = {
                adultvalue: adultvalue1,
                childvalue: childvalue1,
                infantvalue: infantvalue1
            };
            if (markupcategoryidwiseagent[0].valuetype.trim() === "F") {

                let findpaxwisefixmarkup = this.findpaxwisefixmarkup(markupcategoryidwiseagent, RequestParameters);
                AgentMarkup = findpaxwisefixmarkup;

            } else if (markupcategoryidwiseagent[0].valuetype.trim() === "P") {

                let findpaxwisepercentagemarkup = this.findpaxwisepercentagemarkup(markupcategoryidwiseagent, RequestParameters, PPBagentSupplierCostAfterCompanyMarkup);
                AgentMarkup = findpaxwisepercentagemarkup;

            }

            let adultvalue = 0;
            let childvalue = 0;
            let infantvalue = 0;
            if (NumberOfadult > 0) {
                adultvalue = PPBagentSupplierCostAfterCompanyMarkup.adultvalue + AgentMarkup.adultvalue;
            }
            if (NumberOfchild > 0) {
                childvalue = PPBagentSupplierCostAfterCompanyMarkup.childvalue + AgentMarkup.childvalue;
            }
            if (NumberOfinfant > 0) {
                infantvalue = PPBagentSupplierCostAfterCompanyMarkup.infantvalue + AgentMarkup.infantvalue;
            }

            var PPBSupplierCostAfterAgentMarkup = {
                adultvalue: adultvalue,
                childvalue: childvalue,
                infantvalue: infantvalue,
                total: adultvalue + childvalue + infantvalue
            }
            let adultvalue2 = PPBSupplierCostAfterAgentMarkup.adultvalue * NumberOfadult;
            let childvalue2 = PPBSupplierCostAfterAgentMarkup.childvalue * NumberOfchild;
            let infantvalue2 = PPBSupplierCostAfterAgentMarkup.infantvalue * NumberOfinfant;
            if (markupconfigurationcalculationmethod === "PPB") {
                SupplierCostAfterAgentMarkup = {
                    adultvalue: adultvalue2,
                    childvalue: childvalue2,
                    infantvalue: infantvalue2
                }

            } else if (markupconfigurationcalculationmethod === "PPN") {
                SupplierCostAfterAgentMarkup = {
                    adultvalue: adultvalue2 * NumberOfNights,
                    childvalue: childvalue2 * NumberOfNights,
                    infantvalue: infantvalue2 * NumberOfNights
                }

            }
            var TotalSupplierCostAfterAgentMarkup = SupplierCostAfterAgentMarkup.adultvalue + SupplierCostAfterAgentMarkup.childvalue + SupplierCostAfterAgentMarkup.infantvalue;

            // console.log(PPBagentSupplierCostAfterCompanyMarkup, "PPBagentSupplierCostAfterCompanyMarkup");
            // console.log(PPBSupplierCostAfterAgentMarkup, "PPBSupplierCostAfterAgentMarkup");
            // console.log(SupplierCostAfterAgentMarkup, "SupplierCostAfterAgentMarkup");
        }


        // End Agent Markup

        // Find Agent Commission

        let SupplierCostAfterAgentCommission = 0;
        let AgentCommission = 0;
        if (flagsharemarkupascommission === false) {

            let markupcategoryidofcommissionwiseagent = AgentWiseData[0].markupcategory.filter(item => item.markupcategoryid === "5");
            if (markupcategoryidofcommissionwiseagent.length > 0) {
                let commissionconfigurationcalculationmethod = markupcategoryidofcommissionwiseagent[0].markupconfigurationcalculationmethod;
                iscommissionable = markupcategoryidofcommissionwiseagent[0].iscommissionable;

                if (commissionconfigurationcalculationmethod === "UPB" || commissionconfigurationcalculationmethod === "UPN") {

                    if (commissionconfigurationcalculationmethod === "UPB") {
                        if (markupconfigurationcalculationmethod === "UPB" || markupconfigurationcalculationmethod === "UPN") {
                            var UPBagentcommissionSupplierCostAfterAgentmarkup = SupplierCostAfterAgentMarkup;
                        } else {
                            var UPBagentcommissionSupplierCostAfterAgentmarkup = SupplierCostAfterAgentMarkup.adultvalue + SupplierCostAfterAgentMarkup.childvalue + SupplierCostAfterAgentMarkup.infantvalue;
                        }
                    } else if (commissionconfigurationcalculationmethod === "UPN") {
                        if (markupconfigurationcalculationmethod === "UPB" || markupconfigurationcalculationmethod === "UPN") {
                            var UPBagentcommissionSupplierCostAfterAgentmarkup = SupplierCostAfterAgentMarkup / NumberOfNights;
                        } else {
                            var UPBagentcommissionSupplierCostAfterAgentmarkup = (SupplierCostAfterAgentMarkup.adultvalue + SupplierCostAfterAgentMarkup.childvalue + SupplierCostAfterAgentMarkup.infantvalue) / NumberOfNights;
                        }
                    }

                    if (markupcategoryidofcommissionwiseagent[0].valuetype.trim() === "F") {

                        let findfixmarkup = this.findfixmarkup(markupcategoryidofcommissionwiseagent, RequestParameters);
                        AgentCommission = findfixmarkup;

                    } else if (markupcategoryidofcommissionwiseagent[0].valuetype.trim() === "P") {

                        let findpercentagemarkup = this.findpercentagemarkup(markupcategoryidofcommissionwiseagent, RequestParameters, UPBagentcommissionSupplierCostAfterAgentmarkup);
                        AgentCommission = findpercentagemarkup;

                    }
                    let UPBSupplierCostAfterAgentCommission = UPBagentcommissionSupplierCostAfterAgentmarkup - AgentCommission;

                    if (commissionconfigurationcalculationmethod === "UPB") {
                        SupplierCostAfterAgentCommission = UPBSupplierCostAfterAgentCommission;

                    } else if (commissionconfigurationcalculationmethod === "UPN") {
                        SupplierCostAfterAgentCommission = UPBSupplierCostAfterAgentCommission * NumberOfNights;

                    }
                    var TotalSupplierCostAfterAgentCommission = SupplierCostAfterAgentCommission;
                } else if (commissionconfigurationcalculationmethod === "PPB" || commissionconfigurationcalculationmethod === "PPN") {

                    let adultvalue1 = 0;
                    let childvalue1 = 0;
                    let infantvalue1 = 0;

                    if (commissionconfigurationcalculationmethod === "PPB") {
                        if (markupconfigurationcalculationmethod === "PPB" || markupconfigurationcalculationmethod === "PPN") {

                            if (NumberOfadult > 0) {
                                adultvalue1 = SupplierCostAfterAgentMarkup.adultvalue / NumberOfadult;
                            }
                            if (NumberOfchild > 0) {
                                childvalue1 = SupplierCostAfterAgentMarkup.childvalue / NumberOfchild;
                            }
                            if (NumberOfinfant > 0) {
                                infantvalue1 = SupplierCostAfterAgentMarkup.infantvalue / NumberOfinfant;
                            }

                        } else {

                            if (NumberOfadult > 0) {
                                adultvalue1 = SupplierCostAfterAgentMarkup / NumberOfTravellers;
                            }
                            if (NumberOfchild > 0) {
                                childvalue1 = SupplierCostAfterAgentMarkup / NumberOfTravellers;
                            }
                            if (NumberOfinfant > 0) {
                                infantvalue1 = SupplierCostAfterAgentMarkup / NumberOfTravellers;
                            }

                        }

                    } else if (commissionconfigurationcalculationmethod === "PPN") {
                        if (markupconfigurationcalculationmethod === "PPB" || markupconfigurationcalculationmethod === "PPN") {

                            if (NumberOfadult > 0) {
                                adultvalue1 = SupplierCostAfterAgentMarkup.adultvalue / NumberOfadult / NumberOfNights;
                            }
                            if (NumberOfchild > 0) {
                                childvalue1 = SupplierCostAfterAgentMarkup.childvalue / NumberOfchild / NumberOfNights;
                            }
                            if (NumberOfinfant > 0) {
                                infantvalue1 = SupplierCostAfterAgentMarkup.infantvalue / NumberOfinfant / NumberOfNights;
                            }

                        } else {

                            if (NumberOfadult > 0) {
                                adultvalue1 = SupplierCostAfterAgentMarkup / NumberOfTravellers / NumberOfNights;
                            }
                            if (NumberOfchild > 0) {
                                childvalue1 = SupplierCostAfterAgentMarkup / NumberOfTravellers / NumberOfNights;
                            }
                            if (NumberOfinfant > 0) {
                                infantvalue1 = SupplierCostAfterAgentMarkup / NumberOfTravellers / NumberOfNights;
                            }

                        }
                    }
                    let PPBagentcommissionSupplierCostAfterAgentmarkup = {
                        adultvalue: adultvalue1,
                        childvalue: childvalue1,
                        infantvalue: infantvalue1
                    };
                    if (markupcategoryidofcommissionwiseagent[0].valuetype.trim() === "F") {

                        let findpaxwisefixmarkup = this.findpaxwisefixmarkup(markupcategoryidofcommissionwiseagent, RequestParameters);
                        AgentCommission = findpaxwisefixmarkup;

                    } else if (markupcategoryidofcommissionwiseagent[0].valuetype.trim() === "P") {

                        let findpaxwisepercentagemarkup = this.findpaxwisepercentagemarkup(markupcategoryidofcommissionwiseagent, RequestParameters, PPBagentcommissionSupplierCostAfterAgentmarkup);
                        AgentCommission = findpaxwisepercentagemarkup;

                    }

                    let adultvalue = 0;
                    let childvalue = 0;
                    let infantvalue = 0;
                    if (NumberOfadult > 0) {
                        adultvalue = PPBagentcommissionSupplierCostAfterAgentmarkup.adultvalue - AgentCommission.adultvalue;
                    }
                    if (NumberOfchild > 0) {
                        childvalue = PPBagentcommissionSupplierCostAfterAgentmarkup.childvalue - AgentCommission.childvalue;
                    }
                    if (NumberOfinfant > 0) {
                        infantvalue = PPBagentcommissionSupplierCostAfterAgentmarkup.infantvalue - AgentCommission.infantvalue;
                    }

                    var PPBSupplierCostAfterAgentCommission = {
                        adultvalue: adultvalue,
                        childvalue: childvalue,
                        infantvalue: infantvalue,
                        total: adultvalue + childvalue + infantvalue
                    }

                    let adultvalue2 = PPBSupplierCostAfterAgentCommission.adultvalue * NumberOfadult;
                    let childvalue2 = PPBSupplierCostAfterAgentCommission.childvalue * NumberOfchild;
                    let infantvalue2 = PPBSupplierCostAfterAgentCommission.infantvalue * NumberOfinfant;

                    if (commissionconfigurationcalculationmethod === "PPB") {
                        SupplierCostAfterAgentCommission = {
                            adultvalue: adultvalue2,
                            childvalue: childvalue2,
                            infantvalue: infantvalue2
                        }

                    } else if (commissionconfigurationcalculationmethod === "PPN") {
                        SupplierCostAfterAgentCommission = {
                            adultvalue: adultvalue2 * NumberOfNights,
                            childvalue: childvalue2 * NumberOfNights,
                            infantvalue: infantvalue2 * NumberOfNights
                        }

                    }
                    var TotalSupplierCostAfterAgentCommission = SupplierCostAfterAgentCommission.adultvalue + SupplierCostAfterAgentCommission.childvalue + SupplierCostAfterAgentCommission.infantvalue;
                }
            } else {
                SupplierCostAfterAgentCommission = TotalSupplierCostAfterAgentMarkup
                var TotalSupplierCostAfterAgentCommission = TotalSupplierCostAfterAgentMarkup
            }
        } else {  // if flagsharemarkupascommission if true then need to take Agent markup as a commission
            AgentCommission = AgentMarkup;
            SupplierCostAfterAgentCommission = SupplierCostAfterCompanyMarkup
            var TotalSupplierCostAfterAgentCommission = TotalSupplierCostAfterCompanyMarkup
        }
        var responsedata = {
            SupplierCost: SupplierCost,
            AgentCurrencyCode: AgentCurrencyCode,
            currencryconversationrate: currencryconversationrate,
            SupplierConvertedCost: SupplierConvertedCost,
            CompanyMarkup: CompanyMarkup,
            TotalSupplierCostAfterCompanyMarkup: TotalSupplierCostAfterCompanyMarkup,
            AgentMarkup: AgentMarkup,
            TotalSupplierCostAfterAgentMarkup: Number.parseFloat(TotalSupplierCostAfterAgentMarkup.toFixed(2)),
            iscommissionable: iscommissionable,
            AgentCommission: AgentCommission,
            TotalSupplierCostAfterAgentCommission: Number.parseFloat(TotalSupplierCostAfterAgentCommission.toFixed(2))
        }
        if (PriceBandCriteria !== undefined && PriceBandCriteria !== "") {
            responsedata.PriceBandCriteria = PriceBandCriteria;
        }
        // var resAPI = apiCommon.createFullApiLog("", JSON.stringify({ "RequestParameters": RequestParameters, "SupplierCost": SupplierCost, "AgentsWiseData": AgentsWiseData }), responsedata, "");
        // apiCommon.doLogs(resAPI, fName, methodName);
        return (responsedata);
    },
    findfixmarkup: function (markupcategoryidwisecompanyagent, RequestParameters) {
        try {
            let fixmarkup = "";
            let BookingDate = new Date();
            let CheckInDate = new Date(RequestParameters.CheckInDate);
            let bookingfromdate = markupcategoryidwisecompanyagent[0].bookingfromdate;
            let bookingtodate = markupcategoryidwisecompanyagent[0].bookingtodate;
            let servicefromdate = markupcategoryidwisecompanyagent[0].servicefromdate;
            let servicetodate = markupcategoryidwisecompanyagent[0].servicetodate;

            if (BookingDate >= bookingfromdate && BookingDate <= bookingtodate && CheckInDate >= servicefromdate && CheckInDate <= servicetodate) {
                fixmarkup = parseFloat(markupcategoryidwisecompanyagent[0].value);
            } else {
                fixmarkup = 0;
            }
            return fixmarkup;
        }
        catch (err) {
            throw (err);
        }
    },
    findpercentagemarkup: function (markupcategoryidwisecompanyagent, RequestParameters, Cost) {
        try {
            let percentagemarkup = "";
            let BookingDate = new Date();
            let CheckInDate = new Date(RequestParameters.CheckInDate);
            let bookingfromdate = markupcategoryidwisecompanyagent[0].bookingfromdate;
            let bookingtodate = markupcategoryidwisecompanyagent[0].bookingtodate;
            let servicefromdate = markupcategoryidwisecompanyagent[0].servicefromdate;
            let servicetodate = markupcategoryidwisecompanyagent[0].servicetodate;

            if (BookingDate >= bookingfromdate && BookingDate <= bookingtodate && CheckInDate >= servicefromdate && CheckInDate <= servicetodate) {
                if (markupcategoryidwisecompanyagent[0].markupconfigurationdetailcalculationmethod === "MKU") {

                    percentagemarkup = (Cost * parseFloat(markupcategoryidwisecompanyagent[0].value)) / 100;

                } else if (markupcategoryidwisecompanyagent[0].markupconfigurationdetailcalculationmethod === "MRG") {

                    percentagemarkup = (Cost * parseFloat(markupcategoryidwisecompanyagent[0].value)) / (100 - parseFloat(markupcategoryidwisecompanyagent[0].value));

                }
            } else {
                percentagemarkup = 0;
            }
            return percentagemarkup;
        }
        catch (err) {
            throw (err);
        }
    },
    findpaxwisefixmarkup: function (markupcategoryidwisecompanyagent, RequestParameters) {
        try {
            let paxwisefixmarkup = "";
            let BookingDate = new Date();
            let CheckInDate = new Date(RequestParameters.CheckInDate);
            let bookingfromdate = markupcategoryidwisecompanyagent[0].bookingfromdate;
            let bookingtodate = markupcategoryidwisecompanyagent[0].bookingtodate;
            let servicefromdate = markupcategoryidwisecompanyagent[0].servicefromdate;
            let servicetodate = markupcategoryidwisecompanyagent[0].servicetodate;

            if (BookingDate >= bookingfromdate && BookingDate <= bookingtodate && CheckInDate >= servicefromdate && CheckInDate <= servicetodate) {
                paxwisefixmarkup = {
                    adultvalue: parseFloat(markupcategoryidwisecompanyagent[0].adultvalue),
                    childvalue: parseFloat(markupcategoryidwisecompanyagent[0].childvalue),
                    infantvalue: parseFloat(markupcategoryidwisecompanyagent[0].infantvalue)
                }
            } else {
                paxwisefixmarkup = {
                    adultvalue: 0,
                    childvalue: 0,
                    infantvalue: 0
                };
            }
            return paxwisefixmarkup;
        }
        catch (err) {
            throw (err);
        }
    },
    findpaxwisepercentagemarkup: function (markupcategoryidwisecompanyagent, RequestParameters, Cost) {
        try {
            let percentagemarkup = "";
            let BookingDate = new Date();
            let CheckInDate = new Date(RequestParameters.CheckInDate);
            let bookingfromdate = markupcategoryidwisecompanyagent[0].bookingfromdate;
            let bookingtodate = markupcategoryidwisecompanyagent[0].bookingtodate;
            let servicefromdate = markupcategoryidwisecompanyagent[0].servicefromdate;
            let servicetodate = markupcategoryidwisecompanyagent[0].servicetodate;
            let NumberOfadult = parseInt(RequestParameters.NumberOfadult);
            let NumberOfchild = parseInt(RequestParameters.NumberOfchild);
            let NumberOfinfant = parseInt(RequestParameters.NumberOfinfant);
            let adultvalue = 0;
            let childvalue = 0;
            let infantvalue = 0;

            if (BookingDate >= bookingfromdate && BookingDate <= bookingtodate && CheckInDate >= servicefromdate && CheckInDate <= servicetodate) {
                if (markupcategoryidwisecompanyagent[0].markupconfigurationdetailcalculationmethod === "MKU") {
                    if (NumberOfadult > 0) {
                        adultvalue = (Cost.adultvalue * parseFloat(markupcategoryidwisecompanyagent[0].adultvalue)) / 100;
                    }
                    if (NumberOfchild > 0) {
                        childvalue = (Cost.childvalue * parseFloat(markupcategoryidwisecompanyagent[0].childvalue)) / 100;
                    }
                    if (NumberOfinfant > 0) {
                        infantvalue = (Cost.infantvalue * parseFloat(markupcategoryidwisecompanyagent[0].infantvalue)) / 100;
                    }

                    percentagemarkup = {
                        adultvalue: adultvalue,
                        childvalue: childvalue,
                        infantvalue: infantvalue
                    };

                } else if (markupcategoryidwisecompanyagent[0].markupconfigurationdetailcalculationmethod === "MRG") {
                    if (NumberOfadult > 0) {
                        adultvalue = (Cost.adultvalue * parseFloat(markupcategoryidwisecompanyagent[0].adultvalue)) / (100 - parseFloat(markupcategoryidwisecompanyagent[0].adultvalue));
                    }
                    if (NumberOfchild > 0) {
                        childvalue = (Cost.childvalue * parseFloat(markupcategoryidwisecompanyagent[0].childvalue)) / (100 - parseFloat(markupcategoryidwisecompanyagent[0].childvalue));
                    }
                    if (NumberOfinfant > 0) {
                        infantvalue = (Cost.infantvalue * parseFloat(markupcategoryidwisecompanyagent[0].infantvalue)) / (100 - parseFloat(markupcategoryidwisecompanyagent[0].infantvalue));
                    }

                    percentagemarkup = {
                        adultvalue: adultvalue,
                        childvalue: childvalue,
                        infantvalue: infantvalue
                    };

                }
            } else {
                percentagemarkup = {
                    adultvalue: 0,
                    childvalue: 0,
                    infantvalue: 0
                };
            }
            return percentagemarkup;
        }
        catch (err) {
            throw (err);
        }
    },
};

module.exports = markupandcommission;